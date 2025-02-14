// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

library AllocationLib {
	uint256 constant PERIOD_INTERVAL = 1 hours;

	// constants for the token minting curve
	uint256 public constant GENESIS_TIMESTAMP = 1722999120;
	uint256 public constant PHASE0_REWARD_PER_DAY = 8937500 * (10 ** 18);
	uint256 public constant NUM_PHASES = 7;
	uint256 public constant PHASE0_PERIOD = 16;

	error InvalidDepositAmount();
	error NotFinishedPeriod();

	event ContributionRecorded(
		uint256 indexed period,
		address indexed recipient,
		uint256 depositAmount,
		uint256 contribution
	);

	struct State {
		// The timestamp of the start of the allocation
		uint256 startTimestamp;
		// Maps period => total contributions in period
		mapping(uint256 => uint256) totalContributions;
		// Map period => user address => user contributions in period
		mapping(uint256 => mapping(address => uint256)) userContributions;
	}

	struct AllocationConstants {
		uint256 startTimestamp;
		uint256 periodInterval;
		uint256 genesisTimestamp;
		uint256 phase0RewardPerDay;
		uint256 numPhases;
		uint256 phase0Period;
	}

	struct AllocationInfo {
		uint256 totalContribution;
		uint256 allocationPerPeriod;
		uint256 userContribution;
		uint256 userAllocation;
	}

	function __AllocationLib_init(State storage state) internal {
		state.startTimestamp =
			(block.timestamp / PERIOD_INTERVAL) *
			PERIOD_INTERVAL;
	}

	function recordContribution(
		State storage state,
		address recipient,
		uint256 depositAmount
	) internal {
		uint256 period = getCurrentPeriod(state);
		uint256 contribution = calculateContribution(depositAmount);
		state.totalContributions[period] += contribution;
		state.userContributions[period][recipient] += contribution;
		emit ContributionRecorded(
			period,
			recipient,
			depositAmount,
			contribution
		);
	}

	function getUserAllocation(
		State storage state,
		uint256 periodNumber,
		address user
	) internal view returns (uint256) {
		if (state.totalContributions[periodNumber] == 0) {
			return 0;
		}
		return
			(getAllocationPerPeriod(state, periodNumber) *
				state.userContributions[periodNumber][user]) /
			state.totalContributions[periodNumber];
	}

	function consumeUserAllocation(
		State storage state,
		uint256 periodNumber,
		address user
	) internal returns (uint256) {
		if (periodNumber >= getCurrentPeriod(state)) {
			revert NotFinishedPeriod();
		}
		uint256 userAllocation = getUserAllocation(state, periodNumber, user);
		state.userContributions[periodNumber][user] = 0;
		return userAllocation;
	}

	function getAllocationPerPeriod(
		State storage state,
		uint256 periodNumber
	) internal view returns (uint256) {
		uint256 rewardPerDay = _getAllocationPerDay(state, periodNumber);
		return (rewardPerDay * PERIOD_INTERVAL) / 1 days;
	}

	function _getAllocationPerDay(
		State storage state,
		uint256 periodNumber
	) internal view returns (uint256) {
		uint256 elapsedDays = (state.startTimestamp +
			periodNumber *
			1 days -
			GENESIS_TIMESTAMP) / 1 days;
		uint256 rewardPerDay = PHASE0_REWARD_PER_DAY;
		for (uint256 i = 0; i < NUM_PHASES; i++) {
			uint256 phaseDays = PHASE0_PERIOD << i;
			if (elapsedDays < phaseDays) {
				return rewardPerDay;
			}
			elapsedDays -= phaseDays;
			rewardPerDay >>= 1;
		}
		return 0;
	}

	function calculateContribution(
		uint256 amount
	) internal pure returns (uint256) {
		if (amount == 0.1 ether) {
			return 1;
		} else if (amount == 1 ether) {
			return 4;
		} else if (amount == 10 ether) {
			return 9;
		} else if (amount == 100 ether) {
			return 16;
		} else {
			revert InvalidDepositAmount();
		}
	}

	function getCurrentPeriod(
		State storage state
	) internal view returns (uint256) {
		return (block.timestamp - state.startTimestamp) / PERIOD_INTERVAL;
	}

	function getAllocationInfo(
		State storage state,
		uint256 periodNumber,
		address user
	) internal view returns (AllocationInfo memory) {
		uint256 totalContribution = state.totalContributions[periodNumber];
		uint256 allocationPerPeriod = getAllocationPerPeriod(
			state,
			periodNumber
		);
		uint256 userContribution = state.userContributions[periodNumber][user];
		uint256 userAllocation = getUserAllocation(state, periodNumber, user);
		return
			AllocationInfo({
				totalContribution: totalContribution,
				allocationPerPeriod: allocationPerPeriod,
				userContribution: userContribution,
				userAllocation: userAllocation
			});
	}

	function getAllocationConstants(State storage state)
		internal
		view
		returns (AllocationConstants memory)
	{
		return
			AllocationConstants({
				startTimestamp: state.startTimestamp,
				periodInterval: PERIOD_INTERVAL,
				genesisTimestamp: GENESIS_TIMESTAMP,
				phase0RewardPerDay: PHASE0_REWARD_PER_DAY,
				numPhases: NUM_PHASES,
				phase0Period: PHASE0_PERIOD
			});
	}
}
