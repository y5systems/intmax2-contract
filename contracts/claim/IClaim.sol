// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ClaimProofPublicInputsLib} from "./lib/ClaimProofPublicInputsLib.sol";
import {ChainedClaimLib} from "./lib/ChainedClaimLib.sol";
import {WithdrawalLib} from "../common/WithdrawalLib.sol";

interface IClaim {
	/// @notice address is zero address
	error AddressZero();

	/// @notice Error thrown when the verification of the withdrawal proof's public input hash chain fails
	error ClaimChainVerificationFailed();

	/// @notice Error thrown when the aggregator in the withdrawal proof's public input doesn't match the actual contract executor
	error ClaimAggregatorMismatch();

	/// @notice Error thrown when the block hash in the withdrawal proof's public input doesn't exist
	/// @param blockHash The non-existent block hash
	error BlockHashNotExists(bytes32 blockHash);

	/// @notice Error thrown when the ZKP verification of the withdrawal proof fails
	error ClaimProofVerificationFailed();

	/// @notice Error thrown when attempting to add a token to direct withdrawal tokens that already exists
	/// @param tokenIndice The index of the token that already exists
	error TokenAlreadyExist(uint256 tokenIndice);

	/// @notice Error thrown when attempting to remove a non-existent token from direct withdrawal tokens
	/// @param tokenIndice The index of the non-existent token
	error TokenNotExist(uint256 tokenIndice);

	/// @notice Emitted when a direct withdrawal is queued
	/// @param withdrawalHash The hash of the withdrawal
	/// @param recipient The address of the recipient
	/// @param withdrawal The withdrawal details
	event DirectWithdrawalQueued(
		bytes32 indexed withdrawalHash,
		address indexed recipient,
		WithdrawalLib.Withdrawal withdrawal
	);

	/// @notice Submit withdrawal proof from intmax2
	/// @param withdrawals List of chained withdrawals
	/// @param publicInputs Public inputs for the withdrawal proof
	/// @param proof The proof data
	function submitClaimProof(
		ChainedClaimLib.ChainedClaim[] calldata withdrawals,
		ClaimProofPublicInputsLib.ClaimProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) external;
}
