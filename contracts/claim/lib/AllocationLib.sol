// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

library AllocationLib {
	uint256 constant PERIOD_INTERVAL = 1 hours;

	uint256 constant MIN_DEPOSIT = 1e17;

	// constants for the token minting curve
	uint256 public constant GENESIS_TIMESTAMP = 1722999120;
	uint256 public constant PHASE0_REWARD_PER_DAY = 8937500 * (10 ** 18);
	uint256 public constant NUM_PHASES = 7;
	uint256 public constant PHASE0_PERIOD = 16;

	error InvalidMultipleOfBase();
	error NotPowerOfTen();
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

	/**
	 * @notice Checks if `amount` is a multiple of 0.1 ETH that can be expressed
	 *         as 0.1 ETH * 10^n. Then returns 4 * n^2 + 1.
	 * @param amount The amount in Wei to check.
	 * @return result 4 * log10(amount / 0.1 ETH) ^ 2 + 1.
	 */
	function calculateContribution(
		uint256 amount
	) internal pure returns (uint256) {
		// First, check if `amount` is a multiple of 0.1 ETH
		if (amount == 0 || amount % MIN_DEPOSIT != 0) {
			revert InvalidMultipleOfBase();
		}

		uint256 ratio = amount / MIN_DEPOSIT;

		// Verify that ratio is 10^n (for n >= 0) while determining log10
		uint256 exponent = 0;
		uint256 temp = ratio;
		while (temp > 1) {
			// If temp is not divisible by 10, ratio is not 10^n
			if (temp % 10 != 0) {
				revert NotPowerOfTen();
			}
			temp /= 10;
			exponent++;
		}

		return (exponent + 1) * (exponent + 1);
	}

	function getCurrentPeriod(
		State storage state
	) internal view returns (uint256) {
		return (block.timestamp - state.startTimestamp) / PERIOD_INTERVAL;
	}
}
