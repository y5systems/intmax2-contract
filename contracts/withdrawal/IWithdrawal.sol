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

	error ClaimableWithdrawalIsTooLarge(
		uint256 claimableWithdrawalId,
		uint256 rear
	);

	event ClaimableWithdrawalQueued(
		uint256 indexed claimableWithdrawalId,
		address indexed recipient,
		WithdrawalLib.Withdrawal withdrawal
	);

	event DirectWithdrawalQueued(
		uint256 indexed directWithdrawalId,
		address indexed recipient,
		WithdrawalLib.Withdrawal withdrawal
	);

	event WithdrawalsQueued(
		uint256 lastDirectWithdrawalId,
		uint256 lastClaimableWithdrawalId
	);

	/**
	 * @notice Submit withdrawal proof
	 * @dev This method is called by the Withdraw Aggregator.
	 * @param withdrawals The list of withdrawals.
	 */
	function submitWithdrawalProof(
		ChainedWithdrawalLib.ChainedWithdrawal[] calldata withdrawals,
		WithdrawalProofPublicInputsLib.WithdrawalProofPublicInputs
			calldata publicInputs,
		bytes calldata proof
	) external;
}
