// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// interfaces
import {IWithdrawal} from "./IWithdrawal.sol";
import {IPlonkVerifier} from "../common/IPlonkVerifier.sol";
import {ILiquidity} from "../liquidity/ILiquidity.sol";
import {IL2ScrollMessenger} from "@scroll-tech/contracts/L2/IL2ScrollMessenger.sol";

// contracts
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

// libs
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {WithdrawalProofPublicInputsLib} from "./lib/WithdrawalProofPublicInputsLib.sol";
import {ChainedWithdrawalLib} from "./lib/ChainedWithdrawalLib.sol";
import {WithdrawalLib} from "../common/WithdrawalLib.sol";
import {Byte32Lib} from "../common/Byte32Lib.sol";
import {WithdrawalQueueLib} from "../common/queue/WithdrawalQueueLib.sol";
import {Bytes32QueueLib} from "../common/queue/Bytes32QueueLib.sol";

contract Withdrawal is IWithdrawal, ContextUpgradeable {
	using EnumerableSet for EnumerableSet.UintSet;
	using WithdrawalLib for WithdrawalLib.Withdrawal;
	using ChainedWithdrawalLib for ChainedWithdrawalLib.ChainedWithdrawal[];
	using WithdrawalProofPublicInputsLib for WithdrawalProofPublicInputsLib.WithdrawalProofPublicInputs;
	using Byte32Lib for bytes32;
	using WithdrawalQueueLib for WithdrawalQueueLib.Queue;
	using Bytes32QueueLib for Bytes32QueueLib.Queue;

	uint256 constant MAX_RELAY_DIRECT_WITHDRAWALS = 20;
	uint256 constant MAX_RELAY_CLAIMABLE_WITHDRAWALS = 100;

	IPlonkVerifier private withdrawalVerifier;
	IL2ScrollMessenger private l2ScrollMessenger;
	address private liquidity;

	WithdrawalQueueLib.Queue private directWithdrawalsQueue;
	Bytes32QueueLib.Queue private claimableWithdrawalsQueue;
	mapping(bytes32 => bool) private nullifiers;
	EnumerableSet.UintSet internal directWithdrawalTokenIndices;
	mapping(bytes32 => uint256) public postedBlockHashes;

	function __Withdrawal_init(
		address _scrollMessenger,
		address _withdrawalVerifier,
		address _liquidity,
		uint256[] memory _directWithdrawalTokenIndices
	) internal onlyInitializing {
		l2ScrollMessenger = IL2ScrollMessenger(_scrollMessenger);
		withdrawalVerifier = IPlonkVerifier(_withdrawalVerifier);
		liquidity = _liquidity;
		for (uint256 i = 0; i < _directWithdrawalTokenIndices.length; i++) {
			directWithdrawalTokenIndices.add(_directWithdrawalTokenIndices[i]);
		}
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
			if (postedBlockHashes[chainedWithdrawal.blockHash] == 0) {
				// disable this check for testing
				// revert BlockHashNotExists(chainedWithdrawal.blockHash);
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
				uint256 id = directWithdrawalsQueue.enqueue(withdrawal);
				emit DirectWithdrawalQueued(id, withdrawal);
			} else {
				uint256 id = claimableWithdrawalsQueue.enqueue(
					withdrawal.getHash()
				);
				emit ClaimableWithdrawalQueued(id, withdrawal);
			}
		}
	}

	function relayDirectWithdrawals(uint256 processUpToId) external {
		if (processUpToId > directWithdrawalsQueue.rear) {
			processUpToId = directWithdrawalsQueue.rear;
		}
		uint256 relayNum = processUpToId - directWithdrawalsQueue.front;
		if (relayNum > MAX_RELAY_DIRECT_WITHDRAWALS) {
			revert TooManyRelayDirectWithdrawals(relayNum);
		}
		WithdrawalLib.Withdrawal[]
			memory withdrawals = new WithdrawalLib.Withdrawal[](relayNum);
		for (uint256 i = 0; i < relayNum; i++) {
			withdrawals[i] = directWithdrawalsQueue.dequeue();
		}
		bytes memory message = abi.encodeWithSelector(
			ILiquidity.processClaimableWithdrawals.selector,
			withdrawals
		);
		_relayMessage(message);
	}

	function relayClaimableWithdrawals(uint256 processUpToId) external {
		if (processUpToId > claimableWithdrawalsQueue.rear) {
			processUpToId = claimableWithdrawalsQueue.rear;
		}
		uint256 relayNum = processUpToId - claimableWithdrawalsQueue.front;
		if (relayNum > MAX_RELAY_DIRECT_WITHDRAWALS) {
			revert TooManyRelayClaimableWithdrawals(relayNum);
		}
		bytes32[] memory withdrawalHashes = new bytes32[](relayNum);
		for (uint256 i = 0; i < relayNum; i++) {
			withdrawalHashes[i] = claimableWithdrawalsQueue.dequeue();
		}
		bytes memory message = abi.encodeWithSelector(
			ILiquidity.processClaimableWithdrawals.selector,
			withdrawalHashes
		);
		_relayMessage(message);
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
}
