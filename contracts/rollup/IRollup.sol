// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ChainedWithdrawalLib} from "./lib/ChainedWithdrawalLib.sol";
import {WithdrawalLib} from "../lib/WithdrawalLib.sol";
import {WithdrawalProofPublicInputsLib} from "./lib/WithdrawalProofPublicInputsLib.sol";

interface IRollup {
	error InvalidBlockBuilder();

	error FraudProofAlreadySubmitted();

	error FraudProofVerificationFailed();

	error WithdrawalProofVerificationFailed();

	error InvalidWithdrawalId();

	error OnlyScrollMessenger();

	error OnlyLiquidity();

	error SenderPublicKeysEmpty();

	error TooManySenderPublicKeys();

	error SenderAccountIdsEmpty();

	error TooManyAccountIds();

	error SenderAccountIdsInvalidLength();

	error WithdrawalBlockHashNotPosted(uint256 requestIndex);

	error WithdrawalsHashMismatch();

	error BlockHashAlreadyPosted();

	error BlockHashNotExists(bytes32 blockHash);

	error BlockHashMismatch(bytes32 given, bytes32 expected);

	error ChallengerMismatch();

	error PairingCheckFailed();

	error WithdrawalChainVerificationFailed();

	error WithdrawalAggregatorMismatch();

	struct Block {
		bytes32 hash;
		address builder;
	}

	struct FraudProofPublicInputs {
		bytes32 blockHash;
		uint32 blockNumber;
		address challenger;
	}

	event DepositsProcessed(bytes32 depositTreeRoot);

	event BlockPosted(
		bytes32 indexed prevBlockHash,
		address indexed blockBuilder,
		uint256 blockNumber,
		bytes32 depositTreeRoot,
		bytes32 signatureHash
	);

	event PubKeysPosted(
		uint256 indexed blockNumber,
		uint256[] senderPublicKeys
	);

	event AccountIdsPosted(uint256 indexed blockNumber, bytes accountIds);

	event BlockFraudProofSubmitted(
		uint32 indexed blockNumber,
		address indexed blockBuilder,
		address indexed challenger
	);

	event ClaimableWithdrawalQueued(WithdrawalLib.Withdrawal withdrawal);

	event DirectWithdrawalQueued(WithdrawalLib.Withdrawal withdrawal);

	/**
	 * @notice Post a new block for senders who have not been assigned an account ID.
	 * @dev Only valid Block Builders can call this function.
	 */
	function postRegistrationBlock(
		bytes32 txTreeRoot,
		bytes16 senderFlags,
		bytes32[2] calldata aggregatedPublicKey,
		bytes32[4] calldata aggregatedSignature,
		bytes32[4] calldata messagePoint,
		uint256[] calldata senderPublicKeys
	) external;

	/**
	 * @notice Post a new block for the sender to whom the account ID is allocated.
	 * @dev Only valid Block Builders can call this function.
	 */
	function postNonRegistrationBlock(
		bytes32 txTreeRoot,
		bytes16 senderFlags,
		bytes32[2] calldata aggregatedPublicKey,
		bytes32[4] calldata aggregatedSignature,
		bytes32[4] calldata messagePoint,
		bytes32 publicKeysHash,
		bytes calldata senderAccountIds
	) external;

	function submitBlockFraudProof(
		FraudProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) external;

	/**
	 * @notice Post withdrawals
	 * @dev This method is called by the Withdraw Aggregator.
	 * @param withdrawals The list of withdrawals.
	 */
	function postWithdrawal(
		ChainedWithdrawalLib.ChainedWithdrawal[] calldata withdrawals,
		WithdrawalProofPublicInputsLib.WithdrawalProofPublicInputs
			calldata publicInputs,
		bytes calldata proof
	) external;

	function relayDirectWithdrawals() external;

	function relayClaimableWithdrawals() external;

	/**
	 * @notice Update the deposit tree branch and root.
	 * @dev Only Liquidity contract can call this function via Scroll Messenger.
	 */
	function processDeposits(
		uint256 lastProcessedDepositId,
		bytes32[] calldata depositHashes
	) external;
}
