// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {DepositLib} from "../common/DepositLib.sol";
import {WithdrawalLib} from "../common/WithdrawalLib.sol";
import {DepositQueueLib} from "./lib/DepositQueueLib.sol";

interface ILiquidity {
	error OnlyRecipientCanCancelDeposit();
	error InvalidDepositHash(bytes32 depositDataHash, bytes32 calculatedHash);
	error SenderIsNotScrollMessenger();
	error WithdrawalAddressNotSet();
	error InvalidWithdrawalAddress();
	error WithdrawalNotFound(bytes32 withdrawalHash);
	error InvalidAmount();
	error InvalidValue();

	event Deposited(
		uint256 indexed depositId,
		address indexed sender,
		bytes32 indexed recipientSaltHash,
		uint32 tokenIndex,
		uint256 amount,
		uint256 requestedAt
	);

	event DepositsAnalyzedAndRelayed(
		uint256 indexed upToDepositId,
		uint256[] rejectedIndices,
		uint256 gasLimit,
		bytes message
	);

	event DepositCanceled(uint256 indexed depositId);

	event WithdrawalClaimable(bytes32 indexed withdrawalHash);

	event DirectWithdrawalsProcessed(
		uint256 indexed lastProcessedDirectWithdrawalId
	);

	event ClaimableWithdrawalsProcessed(
		uint256 indexed lastProcessedClaimableWithdrawalId
	);

	event ClaimedWithdrawal(
		address indexed recipient,
		bytes32 indexed withdrawalHash
	);

	/// @notice Deposit native token
	/// @dev recipientSaltHash is the Poseidon hash of the intmax2 address (32 bytes) and a secret salt
	/// @param recipientSaltHash The hash of the recipient's address and a secret salt
	function depositNativeToken(bytes32 recipientSaltHash) external payable;

	/// @notice Deposit a specified amount of ERC20 token
	/// @dev Requires prior approval for this contract to spend the tokens
	/// @dev recipientSaltHash is the Poseidon hash of the intmax2 address (32 bytes) and a secret salt
	/// @param tokenAddress The address of the ERC20 token contract
	/// @param recipientSaltHash The hash of the recipient's address and a secret salt
	/// @param amount The amount of tokens to deposit
	function depositERC20(
		address tokenAddress,
		bytes32 recipientSaltHash,
		uint256 amount
	) external;

	/// @notice Deposit an ERC721 token
	/// @dev Requires prior approval for this contract to transfer the token
	/// @param tokenAddress The address of the ERC721 token contract
	/// @param recipientSaltHash The hash of the recipient's address and a secret salt
	/// @param tokenId The ID of the token to deposit
	function depositERC721(
		address tokenAddress,
		bytes32 recipientSaltHash,
		uint256 tokenId
	) external;

	/// @notice Deposit a specified amount of ERC1155 tokens
	/// @param tokenAddress The address of the ERC1155 token contract
	/// @param recipientSaltHash The hash of the recipient's address and a secret salt
	/// @param tokenId The ID of the token to deposit
	/// @param amount The amount of tokens to deposit
	function depositERC1155(
		address tokenAddress,
		bytes32 recipientSaltHash,
		uint256 tokenId,
		uint256 amount
	) external;

	/// @notice Trusted nodes submit the IDs of deposits that do not meet AML standards by this method
	/// @dev upToDepositId specifies the last deposit id that have been analyzed. It must be greater than lastAnalyzedDeposit and less than or equal to the latest Deposit ID.
	/// @dev rejectDepositIndices must be greater than lastAnalyzedDeposit and less than or equal to upToDepositId.
	/// @param upToDepositId The upper limit of the Deposit ID that has been analyzed. It must be greater than lastAnalyzedDeposit and less than or equal to the latest Deposit ID.
	/// @param rejectDepositIds An array of ids of deposits to exclude. These indices must be greater than lastAnalyzedDeposit and less than or equal to upToDepositId.
	/// @param gasLimit The gas limit for the l2 transaction.
	function analyzeAndRelayDeposits(
		uint256 upToDepositId,
		uint256[] memory rejectDepositIds,
		uint256 gasLimit
	) external payable;

	/// @notice Method to cancel a deposit
	/// @dev The deposit ID and its content should be included in the calldata
	/// @param depositId The ID of the deposit to cancel
	/// @param deposit The deposit data
	function cancelDeposit(
		uint256 depositId,
		DepositLib.Deposit calldata deposit
	) external;

	/// @notice Process withdrawals, called by the scroll messenger
	/// @param lastProcessedDirectWithdrawalId The ID of the last processed direct withdrawal
	/// @param withdrawals Array of withdrawals to process
	/// @param lastProcessedClaimableWithdrawalId The ID of the last processed claimable withdrawal
	/// @param withdrawalHahes Array of withdrawal hashes
	function processWithdrawals(
		uint256 lastProcessedDirectWithdrawalId,
		WithdrawalLib.Withdrawal[] calldata withdrawals,
		uint256 lastProcessedClaimableWithdrawalId,
		bytes32[] calldata withdrawalHahes
	) external;

	/// @notice Get the ID of the last deposit relayed to L2
	/// @return The ID of the last relayed deposit
	function getLastRelayedDepositId() external view returns (uint256);

	/// @notice Get deposit data for a given deposit ID
	/// @param depositId The ID of the deposit
	/// @return The deposit data
	function getDepositData(
		uint256 depositId
	) external view returns (DepositQueueLib.DepositData memory);

	/// @notice Claim withdrawals for tokens that are not direct withdrawals
	/// @param withdrawals Array of withdrawals to claim
	function claimWithdrawals(
		WithdrawalLib.Withdrawal[] calldata withdrawals
	) external;

	/// @notice ERC1155 token receiver function
	/// @return bytes4 The function selector
	function onERC1155Received(
		address,
		address,
		uint256,
		uint256,
		bytes calldata
	) external pure returns (bytes4);
}
