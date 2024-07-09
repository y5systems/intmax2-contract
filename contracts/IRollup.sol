// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ILiquidity} from "./ILiquidity.sol";

interface IRollup {
	struct Block {
		bytes32 prevBlockHash;
		bytes32 depositTreeRoot;
		bytes32 signatureHash;
	}

	struct Withdrawal {
		address recipient;
		uint32 tokenIndex;
		uint256 amount;
		bytes32 salt;
	}

	struct FraudProofPublicInputs {
		bytes32 blockHash;
		uint32 blockNumber;
  		address blockBuilder;
		address challenger;
	}

	struct WithdrawalProofPublicInputs {
		bytes32 withdrawalTreeRoot;
		address withdrawalAggregator;
	}

	event DepositsProcessed(bytes32 depositTreeRoot);

	event BlockPosted(
		bytes32 indexed prevBlockHash,
		address indexed blockBuilder,
		uint256 blockNumber,
		bytes32 depositTreeRoot,
		bytes32 signatureHash
	);

	event BlockFraudProofSubmitted(
		uint32 indexed blockNumber,
		address indexed blockBuilder,
		address indexed challenger
	);

	event WithdrawRequested(
		bytes32 indexed withdrawalRequest,
		address withdrawalAggregator
	);

	error FraudProofAlreadySubmitted();

	error FraudProofVerificationFailed();

	error WithdrawalProofVerificationFailed();

	/**
	 * @notice Post new block by Block Builder.
	 * @dev Only valid Block Builders can call this function.
	 */
	function postBlock(
		bool isRegistrationBlock,
		bytes32 txTreeRoot,
		uint128 senderFlags,
		bytes32 publicKeysHash,
		bytes32 accountIdsHash,
		uint256[2] calldata aggregatedPublicKey,
		uint256[4] calldata aggregatedSignature,
		uint256[4] calldata messagePoint
	) external returns (uint256 blockNumber);

	function submitBlockFraudProof(
		FraudProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) external;

	/**
	 * @notice Post the withdrawal requests.
	 * @dev This method is called by the Withdraw Aggregator.
	 * @param withdrawals The list of withdrawals.
	 */
	function postWithdrawalRequests(
		Withdrawal[] calldata withdrawals,
		WithdrawalProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) external;

	/**
	 * @notice Submit the withdrawals.
	 * @dev This method is called by the Withdraw Aggregator.
	 */
	function submitWithdrawals(uint256 lastProcessedWithdrawId) external;

	/**
	 * @notice Update the deposit tree branch and root.
	 * @dev Only Liquidity contract can call this function via Scroll Messenger.
	 */
	function processDeposits(
		uint256 lastProcessedDepositId,
		bytes32[] calldata depositHashes
	) external;

	function getDepositTreeRoot() external view returns (bytes32);

	function getBlockHash(uint32 blockNumber) external view returns (bytes32);

	function getLastProcessedWithdrawalId() external view returns (uint256);
}
