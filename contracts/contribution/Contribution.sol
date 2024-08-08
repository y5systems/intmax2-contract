// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {UD60x18, ud} from "@prb/math/src/UD60x18.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {IContribution} from "./IContribution.sol";

contract Contribution is UUPSUpgradeable, AccessControlUpgradeable {
	bytes32 public constant WEIGHT_REGISTRAR = keccak256("WEIGHT_REGISTRAR");
	bytes32 public constant CONTRIBUTOR = keccak256("CONTRIBUTOR");

	function initialize() public initializer {
		__UUPSUpgradeable_init();
		__AccessControl_init();
		_grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
		_grantRole(WEIGHT_REGISTRAR, _msgSender());
		_grantRole(CONTRIBUTOR, _msgSender());
	}

	// period to tag to total contributions
	mapping(uint256 => mapping(bytes32 => uint256))
		public totalContributionsInPeriod;

	// period to tag to user contributions
	mapping(uint256 => mapping(bytes32 => mapping(address => uint256)))
		public userContributionsInPeriod;

	mapping(uint256 => mapping(bytes32 => uint256))
		public contributionWeightOfPeriod;

	bytes32[] allTags;

	function getAllTags() external view returns (bytes32[] memory) {
		return allTags;
	}

	function registerWeights(
		uint256 periodNumber,
		bytes32[] memory tags,
		uint256[] memory weights
	) external onlyRole(WEIGHT_REGISTRAR) {
		require(tags.length == weights.length, "Invalid input length");
		for (uint256 i = 0; i < tags.length; i++) {
			contributionWeightOfPeriod[periodNumber][tags[i]] = weights[i];
		}
		allTags = tags;
	}

	function recordContribution(
		uint256 periodNumber,
		bytes32 tag,
		address user,
		uint256 amount
	) external onlyRole(CONTRIBUTOR) {
		totalContributionsInPeriod[periodNumber][tag] += amount;
		userContributionsInPeriod[periodNumber][tag][user] += amount;
	}

	function getContributionRateOfTag(
		uint256 periodNumber,
		bytes32 tag,
		address contributor
	) public view returns (UD60x18) {
		uint256 totalContribution = totalContributionsInPeriod[periodNumber][
			tag
		];
		uint256 userContribution = userContributionsInPeriod[periodNumber][tag][
			contributor
		];
		return ud(userContribution).div(ud(totalContribution));
	}

	function getContributionRate(
		uint256 periodNumber,
		address contributor
	) external view returns (UD60x18) {
		UD60x18 totalContribution = ud(0);
		UD60x18 userContribution = ud(0);
		for (uint256 i = 0; i < allTags.length; i++) {
			bytes32 tag = allTags[i];
			UD60x18 weight = ud(contributionWeightOfPeriod[periodNumber][tag]);
			totalContribution =
				totalContribution +
				ud(totalContributionsInPeriod[periodNumber][tag]) *
				weight;
			userContribution =
				userContribution +
				ud(userContributionsInPeriod[periodNumber][tag][contributor]) *
				weight;
		}
		return userContribution.div(totalContribution);
	}

	function _authorizeUpgrade(
		address newImplementation
	) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
