// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IL1GasPriceOracle {
    function l1BaseFee() external view returns (uint256);
}
