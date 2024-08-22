// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {WithdrawalProofPublicInputsLib} from "./lib/WithdrawalProofPublicInputsLib.sol";
import {ChainedWithdrawalLib} from "./lib/ChainedWithdrawalLib.sol";
import {WithdrawalLib} from "../common/WithdrawalLib.sol";

interface IWithdrawal {
	error WithdrawalChainVerificationFailed();

	error WithdrawalAggregatorMismatch();

	error WithdrawalBlockHashNotPosted(uint256 requestIndex);

	error WithdrawalsHashMismatch();

	error BlockHashNotExists(bytes32 blockHash);

	error WithdrawalProofVerificationFailed();

	error TooManyRelayDirectWithdrawals(uint256 count);

	error TooManyRelayClaimableWithdrawals(uint256 count);

	error DirectWithdrawalIsTooLarge(uint256 directWithdrawalId, uint256 rear);

	error TokenAlreadyExist(uint256 tokenIndice);

	error TokenNotExist(uint256 tokenIndice);

	/// @notice Thrown when a claimable withdrawal is too large
	/// @param claimableWithdrawalId The ID of the claimable withdrawal
	/// @param rear The rear value that caused the error
	error ClaimableWithdrawalIsTooLarge(
		uint256 claimableWithdrawalId,
		uint256 rear
	);

	/// @notice Emitted when a claimable withdrawal is queued
	/// @param claimableWithdrawalId The ID of the claimable withdrawal
	/// @param recipient The address of the recipient
	/// @param withdrawal The withdrawal details
	event ClaimableWithdrawalQueued(
		uint256 indexed claimableWithdrawalId,
		address indexed recipient,
		WithdrawalLib.Withdrawal withdrawal
	);

	/// @notice Emitted when a direct withdrawal is queued
	/// @param directWithdrawalId The ID of the direct withdrawal
	/// @param recipient The address of the recipient
	/// @param withdrawal The withdrawal details
	event DirectWithdrawalQueued(
		uint256 indexed directWithdrawalId,
		address indexed recipient,
		WithdrawalLib.Withdrawal withdrawal
	);

	/// @notice Emitted when withdrawals are queued
	/// @param lastDirectWithdrawalId The ID of the last direct withdrawal
	/// @param lastClaimableWithdrawalId The ID of the last claimable withdrawal
	event WithdrawalsQueued(
		uint256 lastDirectWithdrawalId,
		uint256 lastClaimableWithdrawalId
	);

	/// @notice Submit withdrawal proof from intmax2
	/// @param withdrawals List of chained withdrawals
	/// @param publicInputs Public inputs for the withdrawal proof
	/// @param proof The proof data
	function submitWithdrawalProof(
		ChainedWithdrawalLib.ChainedWithdrawal[] calldata withdrawals,
		WithdrawalProofPublicInputsLib.WithdrawalProofPublicInputs
			calldata publicInputs,
		bytes calldata proof
	) external;

	/// @notice Get the token indices for direct withdrawals
	/// @return An array of token indices
	function getDirectWithdrawalTokenIndices()
		external
		view
		returns (uint256[] memory);

	/// @notice Add token indices to the list of direct withdrawal token indices
	/// @param tokenIndices The token indices to add
	function addDirectWithdrawalTokenIndices(
		uint256[] calldata tokenIndices
	) external;

	/// @notice Remove token indices from the list of direct withdrawal token indices
	/// @param tokenIndices The token indices to remove
	function removeDirectWithdrawalTokenIndices(
		uint256[] calldata tokenIndices
	) external;
}
