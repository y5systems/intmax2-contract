// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IL2ScrollMessenger} from "@scroll-tech/contracts/L2/IL2ScrollMessenger.sol";
import {IWithdrawal} from "./IWithdrawal.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {WithdrawalProofPublicInputsLib} from "./lib/WithdrawalProofPublicInputsLib.sol";
import {ChainedWithdrawalLib} from "./lib/ChainedWithdrawalLib.sol";
import {WithdrawalLib} from "../lib/WithdrawalLib.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IPlonkVerifier} from "./IPlonkVerifier.sol";
import {ILiquidity} from "../liquidity/ILiquidity.sol";
import {Byte32Lib} from "./lib/Byte32Lib.sol";

contract Withdrawal is IWithdrawal, OwnableUpgradeable {
	using EnumerableSet for EnumerableSet.UintSet;
	using WithdrawalLib for WithdrawalLib.Withdrawal;
	using ChainedWithdrawalLib for ChainedWithdrawalLib.ChainedWithdrawal[];
	using WithdrawalProofPublicInputsLib for WithdrawalProofPublicInputsLib.WithdrawalProofPublicInputs;
	using Byte32Lib for bytes32;

	uint256 constant MAX_RELAY_DIRECT_WITHDRAWALS = 20;
	uint256 constant MAX_RELAY_CLAIMABLE_WITHDRAWALS = 100;

	WithdrawalLib.Withdrawal[] private directWithdrawalsQueue;
	bytes32[] private claimableWithdrawalsQueue;
	mapping(bytes32 => bool) private nullifiers;
	EnumerableSet.UintSet internal directWithdrawalTokenIndices;
	mapping(bytes32 => uint256) public postedBlockHashes;

	IPlonkVerifier private verifier;
	IL2ScrollMessenger private l2ScrollMessenger;
	address private liquidity;

	function postWithdrawal(
		ChainedWithdrawalLib.ChainedWithdrawal[] calldata withdrawals,
		WithdrawalProofPublicInputsLib.WithdrawalProofPublicInputs
			calldata publicInputs,
		bytes calldata proof
	) external {
		// verify public inputs
		if (
			!withdrawals.verifyWithdrawalChain(publicInputs.lastWithdrawalHash)
		) {
			revert WithdrawalChainVerificationFailed();
		}
		if (publicInputs.withdrawalAggregator != _msgSender()) {
			revert WithdrawalAggregatorMismatch();
		}
		if (!verifier.Verify(proof, publicInputs.getHash().split())) {
			revert WithdrawalProofVerificationFailed();
		}
		for (uint256 i = 0; i < withdrawals.length; i++) {
			ChainedWithdrawalLib.ChainedWithdrawal
				memory chainedWithdrawal = withdrawals[i];
			if (postedBlockHashes[chainedWithdrawal.blockHash] == 0) {
				revert BlockHashNotExists(chainedWithdrawal.blockHash);
			}
			if (nullifiers[chainedWithdrawal.nullifier] == true) {
				continue; // already withdrawn
			}
			nullifiers[chainedWithdrawal.nullifier] = true;
			WithdrawalLib.Withdrawal memory withdrawal = WithdrawalLib
				.Withdrawal(
					chainedWithdrawal.recipient,
					chainedWithdrawal.tokenIndex,
					chainedWithdrawal.amount,
					chainedWithdrawal.nullifier
				);
			if (_isDirectWithdrawalToken(chainedWithdrawal.tokenIndex)) {
				directWithdrawalsQueue.push(withdrawal);
				emit DirectWithdrawalQueued(withdrawal);
			} else {
				claimableWithdrawalsQueue.push(withdrawal.getHash());
				emit ClaimableWithdrawalQueued(withdrawal);
			}
		}
	}

	// pass message to messanger
	function relayDirectWithdrawals() external {
		uint256 length = directWithdrawalsQueue.length;
		uint256 relayNum = length > MAX_RELAY_DIRECT_WITHDRAWALS
			? MAX_RELAY_DIRECT_WITHDRAWALS
			: length;

		WithdrawalLib.Withdrawal[]
			memory withdrawals = new WithdrawalLib.Withdrawal[](relayNum);
		for (uint256 i = 0; i < relayNum; i++) {
			withdrawals[i] = directWithdrawalsQueue[
				directWithdrawalsQueue.length - 1
			];
			directWithdrawalsQueue.pop();
		}
		// note
		// The specification of ScrollMessenger may change in the future.
		// https://docs.scroll.io/en/developers/l1-and-l2-bridging/the-scroll-messenger/
		bytes memory message = abi.encodeWithSelector(
			ILiquidity.processDirectWithdrawals.selector,
			withdrawals
		);
		// processWithdrawals is not payable, so value should be 0
		// TODO In the testnet, the gas limit was 0 and there was no problem. In production, it is necessary to check what will happen.
		l2ScrollMessenger.sendMessage{value: 0}( // TODO msg.value is 0, ok?
			liquidity,
			0, // value
			message,
			0, // TODO gaslimit
			_msgSender()
		);
	}

	// pass message to messanger
	function relayClaimableWithdrawals() external {
		uint256 length = claimableWithdrawalsQueue.length;
		uint256 relayNum = length > MAX_RELAY_CLAIMABLE_WITHDRAWALS
			? MAX_RELAY_CLAIMABLE_WITHDRAWALS
			: length;

		bytes32[] memory withdrawalHashes = new bytes32[](relayNum);
		for (uint256 i = 0; i < relayNum; i++) {
			withdrawalHashes[i] = claimableWithdrawalsQueue[
				claimableWithdrawalsQueue.length - 1
			];
			claimableWithdrawalsQueue.pop();
		}
		// note
		// The specification of ScrollMessenger may change in the future.
		// https://docs.scroll.io/en/developers/l1-and-l2-bridging/the-scroll-messenger/
		bytes memory message = abi.encodeWithSelector(
			ILiquidity.processClaimableWithdrawals.selector,
			withdrawalHashes
		);
		// processWithdrawals is not payable, so value should be 0
		// TODO In the testnet, the gas limit was 0 and there was no problem. In production, it is necessary to check what will happen.
		l2ScrollMessenger.sendMessage{value: 0}( // TODO msg.value is 0, ok?
			liquidity,
			0, // value
			message,
			0, // TODO gaslimit
			_msgSender()
		);
	}

	function _isDirectWithdrawalToken(
		uint32 tokenIndex
	) internal view returns (bool) {
		return directWithdrawalTokenIndices.contains(tokenIndex);
	}
}
