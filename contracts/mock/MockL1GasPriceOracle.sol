// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IL1GasPriceOracle} from "../IL1GasPriceOracle.sol";

contract MockL1GasPriceOracle is IL1GasPriceOracle {
    uint256 immutable BASE_FEE;

    constructor(uint256 baseFee) {
        BASE_FEE = baseFee;
    }

    function l1BaseFee() external view returns (uint256) {
        return BASE_FEE;
    }
}
