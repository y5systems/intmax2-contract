// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

library DepositLimit {
	error InvalidTokenIndex();

	// Token indices
	uint8 internal constant ETH_INDEX = 0;
	uint8 internal constant WBTC_INDEX = 1;
	uint8 internal constant USDC_INDEX = 2;

	// Time periods in days
	uint16 internal constant PERIOD_1 = 183; // 6m
	uint16 internal constant PERIOD_2 = 365; // 1y
	uint16 internal constant PERIOD_3 = 548; // 1.5y
	uint16 internal constant PERIOD_4 = 730; // 2y
	uint16 internal constant PERIOD_5 = 913; // 2.5y
	uint16 internal constant PERIOD_6 = 1095; // 3y
	uint16 internal constant PERIOD_7 = 1277; // 3.5y

	// ETH limits
	uint256 internal constant ETH_LIMIT_0 = 10 ether; // 0-6m
	uint256 internal constant ETH_LIMIT_1 = 50 ether; // 6m-1y
	uint256 internal constant ETH_LIMIT_2 = 100 ether; // 1y-1.5y
	uint256 internal constant ETH_LIMIT_3 = 500 ether; // 1.5y-2y
	uint256 internal constant ETH_LIMIT_4 = 1000 ether; // 2y-2.5y
	uint256 internal constant ETH_LIMIT_5 = 5000 ether; // 2.5y-3y
	uint256 internal constant ETH_LIMIT_6 = 10000 ether; // 3y-3.5y

	// WBTC limits (in satoshi)
	uint256 internal constant WBTC_LIMIT_0 = 50000000; // 0.5 BTC
	uint256 internal constant WBTC_LIMIT_1 = 100000000; // 1 BTC
	uint256 internal constant WBTC_LIMIT_2 = 500000000; // 5 BTC
	uint256 internal constant WBTC_LIMIT_3 = 1000000000; // 10 BTC
	uint256 internal constant WBTC_LIMIT_4 = 5000000000; // 50 BTC
	uint256 internal constant WBTC_LIMIT_5 = 10000000000; // 100 BTC
	uint256 internal constant WBTC_LIMIT_6 = 50000000000; // 500 BTC

	// USDC limits
	uint256 internal constant USDC_LIMIT_0 = 50000000000; // 50k USDC
	uint256 internal constant USDC_LIMIT_1 = 100000000000; // 100k USDC
	uint256 internal constant USDC_LIMIT_2 = 500000000000; // 500k USDC
	uint256 internal constant USDC_LIMIT_3 = 1000000000000; // 1M USDC
	uint256 internal constant USDC_LIMIT_4 = 5000000000000; // 5M USDC
	uint256 internal constant USDC_LIMIT_5 = 10000000000000; // 10M USDC
	uint256 internal constant USDC_LIMIT_6 = 50000000000000; // 50M USDC

	function getDepositLimit(
		uint32 tokenIndex,
		uint256 deploymentTime
	) internal view returns (uint256 limit) {
		if (tokenIndex > 2) revert InvalidTokenIndex();

		if (block.timestamp < deploymentTime) {
			if (tokenIndex == ETH_INDEX) return ETH_LIMIT_0;
			if (tokenIndex == WBTC_INDEX) return WBTC_LIMIT_0;
			return USDC_LIMIT_0;
		}

		uint256 daysElapsed = (block.timestamp - deploymentTime) / 1 days;

		// Return maximum limit after Period 7
		if (daysElapsed >= PERIOD_7) {
			return type(uint256).max;
		}

		// Determine period index
		uint8 periodIndex;
		if (daysElapsed >= PERIOD_6) periodIndex = 6;
		else if (daysElapsed >= PERIOD_5) periodIndex = 5;
		else if (daysElapsed >= PERIOD_4) periodIndex = 4;
		else if (daysElapsed >= PERIOD_3) periodIndex = 3;
		else if (daysElapsed >= PERIOD_2) periodIndex = 2;
		else if (daysElapsed >= PERIOD_1) periodIndex = 1;
		else periodIndex = 0;

		// Return limit based on token type and period
		if (tokenIndex == ETH_INDEX) {
			if (periodIndex == 0) return ETH_LIMIT_0;
			if (periodIndex == 1) return ETH_LIMIT_1;
			if (periodIndex == 2) return ETH_LIMIT_2;
			if (periodIndex == 3) return ETH_LIMIT_3;
			if (periodIndex == 4) return ETH_LIMIT_4;
			if (periodIndex == 5) return ETH_LIMIT_5;
			return ETH_LIMIT_6;
		} else if (tokenIndex == WBTC_INDEX) {
			if (periodIndex == 0) return WBTC_LIMIT_0;
			if (periodIndex == 1) return WBTC_LIMIT_1;
			if (periodIndex == 2) return WBTC_LIMIT_2;
			if (periodIndex == 3) return WBTC_LIMIT_3;
			if (periodIndex == 4) return WBTC_LIMIT_4;
			if (periodIndex == 5) return WBTC_LIMIT_5;
			return WBTC_LIMIT_6;
		} else {
			if (periodIndex == 0) return USDC_LIMIT_0;
			if (periodIndex == 1) return USDC_LIMIT_1;
			if (periodIndex == 2) return USDC_LIMIT_2;
			if (periodIndex == 3) return USDC_LIMIT_3;
			if (periodIndex == 4) return USDC_LIMIT_4;
			if (periodIndex == 5) return USDC_LIMIT_5;
			return USDC_LIMIT_6;
		}
	}
}
