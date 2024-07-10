// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IL1GasPriceOracle} from "@scroll-tech/contracts/L2/predeploys/IL1GasPriceOracle.sol";

contract MockL1GasPriceOracle is IL1GasPriceOracle {
	uint256 immutable BASE_FEE;

	constructor(uint256 baseFee) {
		BASE_FEE = baseFee;
	}

	function l1BaseFee() external view returns (uint256) {
		return BASE_FEE;
	}

	function overhead() external pure returns (uint256) {
		return 0;
	}

	function scalar() external pure returns (uint256) {
		return 1;
	}

	function getL1Fee(bytes memory) external view returns (uint256) {
		return BASE_FEE;
	}

	function getL1GasUsed(bytes memory) external pure returns (uint256) {
		return 0;
	}

	function setL1BaseFee(uint256) external {}
}
