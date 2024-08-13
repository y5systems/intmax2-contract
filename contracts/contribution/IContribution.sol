// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {UD60x18} from "@prb/math/src/UD60x18.sol";

interface IContribution {
	error InvalidInputLength();

	function getTags(
		uint256 periodNumber
	) external view returns (bytes32[] memory);

	function getWeights(
		uint256 periodNumber
	) external view returns (uint256[] memory);

	function registerWeights(
		uint256 periodNumber,
		bytes32[] memory tags,
		uint256[] memory weights
	) external;

	function recordContribution(
		bytes32 tag,
		address user,
		uint256 amount
	) external;

	function getContributionRate(
		uint256 periodNumber,
		address contributor
	) external view returns (UD60x18);
}
