// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

// deposit amountに応じて、allocationを割り当てる
library AllocationLib {
	uint256 constant BASE = 1e17;

	/**
	 * @dev Custom errors for more descriptive revert messages.
	 */
	error InvalidMultipleOfBase();
	error NotPowerOfTen();

	/**
	 * @notice Checks if `amount` is a multiple of 0.1 ETH that can be expressed
	 *         as 0.1 ETH * 10^n. Then returns the square of the base-10 logarithm
	 *         of (amount / 0.1 ETH).
	 * @param amount The amount in Wei to check.
	 * @return result The square of log10(amount / 0.1 ETH).
	 */
	function calculateWeight(uint256 amount) public pure returns (uint256) {
		// First, check if `amount` is a multiple of 0.1 ETH
		if (amount == 0 || amount % BASE != 0) {
			revert InvalidMultipleOfBase();
		}

		uint256 ratio = amount / BASE;

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

		// log10(ratio) = exponent, so return exponent^2
		return exponent * exponent;
	}
}
