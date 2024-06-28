// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IScrollMessenger} from "./IScrollMessenger.sol";

interface IL1ScrollMessenger is IScrollMessenger {
    struct L2MessageProof {
        bytes32 batchHash;
        bytes merkleProof;
    }

    function relayMessageWithProof(
        address from,
        address to,
        uint256 value,
        uint256 nonce,
        bytes memory message,
        L2MessageProof memory proof
    ) external;
}
