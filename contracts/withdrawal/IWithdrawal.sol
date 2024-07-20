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

	event ClaimableWithdrawalQueued(
		uint256 claimableWithdrawalId,
		WithdrawalLib.Withdrawal withdrawal
	);

	event DirectWithdrawalQueued(
		uint256 directWithdrawalId,
		WithdrawalLib.Withdrawal withdrawal
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

	function relayDirectWithdrawals(uint256 processUpToId) external;

	function relayClaimableWithdrawals(uint256 processUpToId) external;
}
