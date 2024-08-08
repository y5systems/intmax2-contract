// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {UD60x18, ud, convert} from "@prb/math/src/UD60x18.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IContribution} from "./IContribution.sol";

contract Contribution is
	IContribution,
	UUPSUpgradeable,
	AccessControlUpgradeable
{
	bytes32 public constant WEIGHT_REGISTRAR = keccak256("WEIGHT_REGISTRAR");
	bytes32 public constant CONTRIBUTOR = keccak256("CONTRIBUTOR");

	uint256 public currentPeriod;

	// period to tag to total contributions
	mapping(uint256 => mapping(bytes32 => uint256))
		public totalContributionsInPeriod;

	// period to tag to user contributions
	mapping(uint256 => mapping(bytes32 => mapping(address => uint256)))
		public contributionsInPeriod;

	// period to tag to weight
	mapping(uint256 => mapping(bytes32 => uint256)) public allWeights;

	// period to tags
	mapping(uint256 => bytes32[]) private allTags;

	modifier onlyAfterWeightRegistration() {
		if (allTags[currentPeriod].length == 0) {
			revert WeightsNotRegistered();
		}
		_;
	}

	function initialize() public initializer {
		__UUPSUpgradeable_init();
		__AccessControl_init();
		_grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
		_grantRole(WEIGHT_REGISTRAR, _msgSender());
		_grantRole(CONTRIBUTOR, _msgSender());
	}

	function getTags(
		uint256 periodNumber
	) external view returns (bytes32[] memory) {
		return allTags[periodNumber];
	}

	function getWeights(
		uint256 periodNumber
	) external view returns (uint256[] memory) {
		uint256[] memory weights = new uint256[](allTags[periodNumber].length);
		for (uint256 i = 0; i < allTags[periodNumber].length; i++) {
			weights[i] = allWeights[periodNumber][allTags[periodNumber][i]];
		}
		return weights;
	}

	function incrementPeriod() external onlyRole(WEIGHT_REGISTRAR) {
		currentPeriod++;
	}

	function registerWeights(
		uint256 periodNumber,
		bytes32[] memory tags,
		uint256[] memory weights
	) external onlyRole(WEIGHT_REGISTRAR) {
		if (tags.length != weights.length) {
			revert InvalidInputLength();
		}
		for (uint256 i = 0; i < tags.length; i++) {
			allWeights[periodNumber][tags[i]] = weights[i];
		}
		allTags[periodNumber] = tags;
	}

	function recordContribution(
		bytes32 tag,
		address user,
		uint256 amount
	) external onlyRole(CONTRIBUTOR) {
		totalContributionsInPeriod[currentPeriod][tag] += amount;
		contributionsInPeriod[currentPeriod][tag][user] += amount;
	}

	function getContributionRate(
		uint256 periodNumber,
		address contributor
	) external view returns (UD60x18) {
		UD60x18 totalContribution = ud(0);
		UD60x18 userContribution = ud(0);
		for (uint256 i = 0; i < allTags[periodNumber].length; i++) {
			bytes32 tag = allTags[currentPeriod][i];
			UD60x18 weight = convert(allWeights[periodNumber][tag]);
			totalContribution =
				totalContribution +
				convert(totalContributionsInPeriod[periodNumber][tag]) *
				weight;
			userContribution =
				userContribution +
				convert(contributionsInPeriod[periodNumber][tag][contributor]) *
				weight;
		}
		return userContribution.div(totalContribution);
	}

	function _authorizeUpgrade(
		address newImplementation
	) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
