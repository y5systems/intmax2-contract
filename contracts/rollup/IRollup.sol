// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IRollup {
	error OnlyScrollMessenger();
	error OnlyLiquidity();
	error SenderPublicKeysEmpty();
	error TooManySenderPublicKeys();
	error SenderAccountIdsEmpty();
	error TooManyAccountIds();
	error SenderAccountIdsInvalidLength();
	error BlockHashAlreadyPosted();
	error PairingCheckFailed();
	error BlockNumberOutOfRange();
	error InvalidBlockBuilder();

	event DepositsProcessed(
		uint256 indexed lastProcessedDepositId,
		bytes32 depositTreeRoot
	);

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

	/// @notice Posts a registration block (for all senders' first transactions, specified by public keys)
	/// @dev The function caller must have staked in the block builder registry beforehand
	/// @param txTreeRoot The root of the transaction tree
	/// @param senderFlags Flags indicating whether senders' signatures are included in the aggregated signature
	/// @param aggregatedPublicKey The aggregated public key
	/// @param aggregatedSignature The aggregated signature
	/// @param messagePoint The hash of the tx tree root to G2
	/// @param senderPublicKeys The public keys of the senders
	function postRegistrationBlock(
		bytes32 txTreeRoot,
		bytes16 senderFlags,
		bytes32[2] calldata aggregatedPublicKey,
		bytes32[4] calldata aggregatedSignature,
		bytes32[4] calldata messagePoint,
		uint256[] calldata senderPublicKeys
	) external;

	/// @notice Posts a non-registration block (for all senders' subsequent transactions, specified by account IDs)
	/// @dev The function caller must have staked in the block builder registry beforehand
	/// @param txTreeRoot The root of the transaction tree
	/// @param senderFlags Sender flags
	/// @param aggregatedPublicKey The aggregated public key
	/// @param aggregatedSignature The aggregated signature
	/// @param messagePoint The hash of the tx tree root to G2
	/// @param publicKeysHash The hash of the public keys
	/// @param senderAccountIds The account IDs arranged in a byte sequence
	function postNonRegistrationBlock(
		bytes32 txTreeRoot,
		bytes16 senderFlags,
		bytes32[2] calldata aggregatedPublicKey,
		bytes32[4] calldata aggregatedSignature,
		bytes32[4] calldata messagePoint,
		bytes32 publicKeysHash,
		bytes calldata senderAccountIds
	) external;

	/// @notice Update the deposit tree branch and root
	/// @dev Only Liquidity contract can call this function via Scroll Messenger
	/// @param lastProcessedDepositId The ID of the last processed deposit
	/// @param depositHashes The hashes of the deposits
	function processDeposits(
		uint256 lastProcessedDepositId,
		bytes32[] calldata depositHashes
	) external;

	/// @notice Get the block number of the latest posted block
	/// @return The latest block number
	function getLatestBlockNumber() external view returns (uint32);

	/// @notice Get the block builder for a specific block number
	/// @param blockNumber The block number to query
	/// @return The address of the block builder
	function getBlockBuilder(
		uint32 blockNumber
	) external view returns (address);

	/// @notice Get the block hash for a specific block number
	/// @param blockNumber The block number to query
	/// @return The hash of the specified block
	function getBlockHash(uint32 blockNumber) external view returns (bytes32);
}
