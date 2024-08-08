// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {UD60x18} from "@prb/math/src/UD60x18.sol";

interface IContribution {
	function registerWeights(
		uint256 periodNumber,
		bytes32[] memory tags,
		uint256[] memory weights
	) external;

	function recordContribution(
		uint256 periodNumber,
		bytes32 tag,
		address user,
		uint256 amount
	) external;

	function getContributionRateOfTag(
		uint256 periodNumber,
		bytes32 tag,
		address contributor
	) external view returns (UD60x18);

	function getContributionRate(
		uint256 periodNumber,
		address contributor
	) external view returns (UD60x18);
}
