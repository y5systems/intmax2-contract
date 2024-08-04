// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IWithdrawal} from "./IWithdrawal.sol";
import {IPlonkVerifier} from "../common/IPlonkVerifier.sol";
import {ILiquidity} from "../liquidity/ILiquidity.sol";
import {IRollup} from "../rollup/IRollup.sol";
import {IL2ScrollMessenger} from "@scroll-tech/contracts/L2/IL2ScrollMessenger.sol";

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {WithdrawalProofPublicInputsLib} from "./lib/WithdrawalProofPublicInputsLib.sol";
import {ChainedWithdrawalLib} from "./lib/ChainedWithdrawalLib.sol";
import {WithdrawalLib} from "../common/WithdrawalLib.sol";
import {Byte32Lib} from "../common/Byte32Lib.sol";

contract Withdrawal is IWithdrawal, UUPSUpgradeable, OwnableUpgradeable {
	using EnumerableSet for EnumerableSet.UintSet;
	using WithdrawalLib for WithdrawalLib.Withdrawal;
	using ChainedWithdrawalLib for ChainedWithdrawalLib.ChainedWithdrawal[];
	using WithdrawalProofPublicInputsLib for WithdrawalProofPublicInputsLib.WithdrawalProofPublicInputs;
	using Byte32Lib for bytes32;

	uint256 private constant MAX_RELAY_DIRECT_WITHDRAWALS = 20;
	uint256 private constant MAX_RELAY_CLAIMABLE_WITHDRAWALS = 100;

	IPlonkVerifier private withdrawalVerifier;
	IL2ScrollMessenger private l2ScrollMessenger;
	IRollup private rollup;
	address private liquidity;
	mapping(bytes32 => bool) private nullifiers;
	EnumerableSet.UintSet internal directWithdrawalTokenIndices;

	uint256 public lastDirectWithdrawalId;
	uint256 public lastClaimableWithdrawalId;

	function initialize(
		address _scrollMessenger,
		address _withdrawalVerifier,
		address _liquidity,
		address _rollup,
		uint256[] memory _directWithdrawalTokenIndices
	) public initializer {
		__Ownable_init(_msgSender());
		__UUPSUpgradeable_init();
		l2ScrollMessenger = IL2ScrollMessenger(_scrollMessenger);
		withdrawalVerifier = IPlonkVerifier(_withdrawalVerifier);
		rollup = IRollup(_rollup);
		liquidity = _liquidity;
		for (uint256 i = 0; i < _directWithdrawalTokenIndices.length; i++) {
			directWithdrawalTokenIndices.add(_directWithdrawalTokenIndices[i]);
		}
	}

	// added onlyOwner for dummy zkp verification
	function submitWithdrawalProof(
		ChainedWithdrawalLib.ChainedWithdrawal[] calldata withdrawals,
		WithdrawalProofPublicInputsLib.WithdrawalProofPublicInputs
			calldata publicInputs,
		bytes calldata proof
	) external onlyOwner {
		// verify public inputs
		if (
			!withdrawals.verifyWithdrawalChain(publicInputs.lastWithdrawalHash)
		) {
			revert WithdrawalChainVerificationFailed();
		}
		if (publicInputs.withdrawalAggregator != _msgSender()) {
			revert WithdrawalAggregatorMismatch();
		}
		if (!withdrawalVerifier.Verify(proof, publicInputs.getHash().split())) {
			revert WithdrawalProofVerificationFailed();
		}
		uint256 directWithdrawalCounter = 0;
		uint256 claimableWithdrawalCounter = 0;
		for (uint256 i = 0; i < withdrawals.length; i++) {
			ChainedWithdrawalLib.ChainedWithdrawal
				memory chainedWithdrawal = withdrawals[i];
			bytes32 expectedBlockHash = rollup.getBlockHash(
				chainedWithdrawal.blockNumber
			);
			if (expectedBlockHash != chainedWithdrawal.blockHash) {
				revert BlockHashNotExists(chainedWithdrawal.blockHash);
			}
			if (nullifiers[chainedWithdrawal.nullifier] == true) {
				continue; // already withdrawn
			}
			nullifiers[chainedWithdrawal.nullifier] = true;
			if (_isDirectWithdrawalToken(chainedWithdrawal.tokenIndex)) {
				directWithdrawalCounter++;
			} else {
				claimableWithdrawalCounter++;
			}
		}
		WithdrawalLib.Withdrawal[]
			memory directWithdrawals = new WithdrawalLib.Withdrawal[](
				directWithdrawalCounter
			);

		bytes32[] memory claimableWithdrawals = new bytes32[](
			claimableWithdrawalCounter
		);

		for (uint256 i = 0; i < withdrawals.length; i++) {
			ChainedWithdrawalLib.ChainedWithdrawal
				memory chainedWithdrawal = withdrawals[i];
			WithdrawalLib.Withdrawal memory withdrawal = WithdrawalLib
				.Withdrawal(
					chainedWithdrawal.recipient,
					chainedWithdrawal.tokenIndex,
					chainedWithdrawal.amount,
					0 // set later
				);
			if (_isDirectWithdrawalToken(chainedWithdrawal.tokenIndex)) {
				lastDirectWithdrawalId++;
				withdrawal.id = lastDirectWithdrawalId;
				directWithdrawals[i] = withdrawal;
				emit DirectWithdrawalQueued(withdrawal.id, withdrawal);
			} else {
				lastClaimableWithdrawalId++;
				withdrawal.id = lastClaimableWithdrawalId;
				claimableWithdrawals[i] = withdrawal.getHash();
				emit ClaimableWithdrawalQueued(withdrawal.id, withdrawal);
			}
		}

		bytes memory message = abi.encodeWithSelector(
			ILiquidity.processWithdrawals.selector,
			lastDirectWithdrawalId,
			directWithdrawals,
			lastClaimableWithdrawalId,
			claimableWithdrawals
		);
		_relayMessage(message);
	}

	// The specification of ScrollMessenger may change in the future.
	// https://docs.scroll.io/en/developers/l1-and-l2-bridging/the-scroll-messenger/
	function _relayMessage(bytes memory message) private {
		uint256 value = 0; // relay to non-payable function
		// In the current implementation of ScrollMessenger, the `gasLimit` is simply included in the L2 event log
		// and does not impose any restrictions on the L1 gas limit. However, considering the possibility of
		// future implementation changes, we will specify a maximum value.
		uint256 gasLimit = type(uint256).max;
		l2ScrollMessenger.sendMessage{value: value}(
			liquidity,
			value,
			message,
			gasLimit,
			_msgSender()
		);
	}

	function _isDirectWithdrawalToken(
		uint32 tokenIndex
	) internal view returns (bool) {
		return directWithdrawalTokenIndices.contains(tokenIndex);
	}

	function _authorizeUpgrade(address) internal override onlyOwner {}
}
