// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IBlockBuilderRegistry} from "./IBlockBuilderRegistry.sol";
import {MIN_STAKE_AMOUNT} from "./BlockBuilderRegistryConst.sol";

library BlockBuilderInfoLib {
	uint256 private constant CHALLENGE_DURATION = 1 days;

	function isStaking(
		IBlockBuilderRegistry.BlockBuilderInfo memory info
	) internal pure returns (bool) {
		return info.stakeAmount != 0;
	}

	function isChallengeDuration(
		IBlockBuilderRegistry.BlockBuilderInfo memory info
	) internal view returns (bool) {
		return block.timestamp - info.stopTime >= CHALLENGE_DURATION;
	}

	function isValidBlockBuilder(
		IBlockBuilderRegistry.BlockBuilderInfo memory info
	) internal pure returns (bool) {
		return info.stakeAmount >= MIN_STAKE_AMOUNT;
	}
}
