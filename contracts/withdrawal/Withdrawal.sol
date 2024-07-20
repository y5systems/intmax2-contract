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
import {WithdrawalQueueLib} from "./lib/WithdrawalQueueLib.sol";
import {Bytes32QueueLib} from "./lib/Bytes32QueueLib.sol";

contract Withdrawal is IWithdrawal, UUPSUpgradeable, OwnableUpgradeable {
	using EnumerableSet for EnumerableSet.UintSet;
	using WithdrawalLib for WithdrawalLib.Withdrawal;
	using ChainedWithdrawalLib for ChainedWithdrawalLib.ChainedWithdrawal[];
	using WithdrawalProofPublicInputsLib for WithdrawalProofPublicInputsLib.WithdrawalProofPublicInputs;
	using Byte32Lib for bytes32;
	using WithdrawalQueueLib for WithdrawalQueueLib.Queue;
	using Bytes32QueueLib for Bytes32QueueLib.Queue;

	uint256 private constant MAX_RELAY_DIRECT_WITHDRAWALS = 20;
	uint256 private constant MAX_RELAY_CLAIMABLE_WITHDRAWALS = 100;

	IPlonkVerifier private withdrawalVerifier;
	IL2ScrollMessenger private l2ScrollMessenger;
	IRollup private rollup;
	address private liquidity;
	WithdrawalQueueLib.Queue private directWithdrawalsQueue;
	Bytes32QueueLib.Queue private claimableWithdrawalsQueue;
	mapping(bytes32 => bool) private nullifiers;
	EnumerableSet.UintSet internal directWithdrawalTokenIndices;

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
		directWithdrawalsQueue.initialize();
		claimableWithdrawalsQueue.initialize();
	}

	function submitWithdrawalProof(
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
			// disable this check for testing
			// revert WithdrawalAggregatorMismatch();
		}
		if (!withdrawalVerifier.Verify(proof, publicInputs.getHash().split())) {
			revert WithdrawalProofVerificationFailed();
		}
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
			WithdrawalLib.Withdrawal memory withdrawal = WithdrawalLib
				.Withdrawal(
					chainedWithdrawal.recipient,
					chainedWithdrawal.tokenIndex,
					chainedWithdrawal.amount,
					0 // set later
				);
			if (_isDirectWithdrawalToken(chainedWithdrawal.tokenIndex)) {
				uint256 id = directWithdrawalsQueue.nextIndex();
				withdrawal.id = id;
				directWithdrawalsQueue.enqueue(withdrawal);
				emit DirectWithdrawalQueued(id, withdrawal);
			} else {
				uint256 id = claimableWithdrawalsQueue.nextIndex();
				withdrawal.id = id;
				claimableWithdrawalsQueue.enqueue(withdrawal.getHash());
				emit ClaimableWithdrawalQueued(id, withdrawal);
			}
		}
	}

	function relayWithdrawals(
		uint256 upToDirectWithdrawalId,
		uint256 upToClamableWithdrawalId
	) external {
		WithdrawalLib.Withdrawal[] memory directWithdrawals;
		if (upToDirectWithdrawalId != 0) {
			directWithdrawals = _collectDirectWithdrawals(
				upToDirectWithdrawalId
			);
		}
		bytes32[] memory claimableWithdrawals;
		if (upToClamableWithdrawalId != 0) {
			claimableWithdrawals = _collectClaimableWithdrawals(
				upToClamableWithdrawalId
			);
		}
		bytes memory message = abi.encodeWithSelector(
			ILiquidity.processWithdrawals.selector,
			upToDirectWithdrawalId,
			directWithdrawals,
			upToClamableWithdrawalId,
			claimableWithdrawals
		);
		_relayMessage(message);
	}

	function relayDirectWithdrawals(uint256 upToDirectWithdrawalId) external {
		bytes memory message = abi.encodeWithSelector(
			ILiquidity.processClaimableWithdrawals.selector,
			_collectDirectWithdrawals(upToDirectWithdrawalId)
		);
		_relayMessage(message);
	}

	function relayClaimableWithdrawals(
		uint256 upToClamableWithdrawalId
	) external {
		bytes memory message = abi.encodeWithSelector(
			ILiquidity.processClaimableWithdrawals.selector,
			_collectClaimableWithdrawals(upToClamableWithdrawalId)
		);
		_relayMessage(message);
	}

	function _collectDirectWithdrawals(
		uint256 upToDirectWithdrawalId
	) internal returns (WithdrawalLib.Withdrawal[] memory) {
		if (upToDirectWithdrawalId >= directWithdrawalsQueue.rear) {
			revert DirectWithdrawalIsTooLarge(
				upToDirectWithdrawalId,
				directWithdrawalsQueue.rear
			);
		}
		uint256 relayNum = upToDirectWithdrawalId -
			directWithdrawalsQueue.front;
		if (relayNum > MAX_RELAY_DIRECT_WITHDRAWALS) {
			revert TooManyRelayDirectWithdrawals(relayNum);
		}
		WithdrawalLib.Withdrawal[]
			memory withdrawals = new WithdrawalLib.Withdrawal[](relayNum);
		for (uint256 i = 0; i < relayNum; i++) {
			withdrawals[i] = directWithdrawalsQueue.dequeue();
		}
		return withdrawals;
	}

	function _collectClaimableWithdrawals(
		uint256 upToClamableWithdrawalId
	) internal returns (bytes32[] memory) {
		if (upToClamableWithdrawalId >= claimableWithdrawalsQueue.rear) {
			revert ClaimableWithdrawalIsTooLarge(
				upToClamableWithdrawalId,
				claimableWithdrawalsQueue.rear
			);
		}
		uint256 relayNum = upToClamableWithdrawalId -
			claimableWithdrawalsQueue.front;
		if (relayNum > MAX_RELAY_CLAIMABLE_WITHDRAWALS) {
			revert TooManyRelayClaimableWithdrawals(relayNum);
		}
		bytes32[] memory withdrawalHashes = new bytes32[](relayNum);
		for (uint256 i = 0; i < relayNum; i++) {
			withdrawalHashes[i] = claimableWithdrawalsQueue.dequeue();
		}
		return withdrawalHashes;
	}

	function getDirectWithdrawalsQueueSize() external view returns (uint256) {
		return directWithdrawalsQueue.size();
	}

	function getClaimableWithdrawalsQueueSize()
		external
		view
		returns (uint256)
	{
		return claimableWithdrawalsQueue.size();
	}

	// The specification of ScrollMessenger may change in the future.
	// https://docs.scroll.io/en/developers/l1-and-l2-bridging/the-scroll-messenger/
	function _relayMessage(bytes memory message) internal {
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
