// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {FraudProofPublicInputsLib} from "./lib/FraudProofPublicInputsLib.sol";

interface IBlockBuilderRegistry {
	error OnlyRollupContract();
	error InsufficientStakeAmount();
	error BlockBuilderNotFound();
	error CannotUnstakeWithinChallengeDuration();
	error FailedTransfer(address to, uint256 amount);

	event BlockBuilderUpdated(
		address indexed blockBuilder,
		string url,
		uint256 stakeAmount
	);

	event BlockBuilderStopped(address indexed blockBuilder);

	event BlockBuilderSlashed(
		address indexed blockBuilder,
		address indexed challenger
	);
	/**
	 * @notice Block builder information.
	 * @param blockBuilderUrl The URL or IP address of Block builder.
	 * @param stakeAmount The stake amount of Block Builder.
	 * @param stopTime The time when the node declares that it has ceased operations.
	 * @param numSlashes The number of times the node has been slashed so far.
	 * @param isValid A flag whether the node is not malicious.
	 */
	struct BlockBuilderInfo {
		string blockBuilderUrl;
		uint256 stakeAmount;
		uint256 stopTime;
		uint256 numSlashes;
		bool isValid;
	}

	/**
	 * @notice Update block builder.
	 * @dev This method is used to register or update the URL or IP address of the block builder.
	 * @dev The block builder must send at least 0.1 ETH to this contract to register.
	 * @param url The URL or IP address of Block builder.
	 */
	function updateBlockBuilder(string memory url) external payable;

	/**
	 * @notice Declare that the block builder has stopped.
	 * @dev This method must be run before unstake.
	 */
	function stopBlockBuilder() external;

	/**
	 * @notice unstake after stoping block builder.
	 * @dev You cannot unstake within one day of the Block Builder's last block submission.
	 *  This is because a fraud proof may be submitted against the posted block, which could result
	 *  in a reduction of the stake.
	 */
	function unstake() external;

	function submitBlockFraudProof(
		FraudProofPublicInputsLib.FraudProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) external;

	/**
	 * @notice Check if the block builder is valid.
	 * @param blockBuilder The address of the block builder.
	 * @return True if the block builder is valid.
	 * @dev The block builder is valid if the stake amount is greater than or equal to 0.1 ETH.
	 */
	function isValidBlockBuilder(
		address blockBuilder
	) external view returns (bool);

	/**
	 * @notice Set the burn address.
	 * @param _burnAddress The burn address.
	 * @dev The burn address is used to burn the stake amount when the block builder is slashed.
	 */
	function setBurnAddress(address _burnAddress) external;
}
