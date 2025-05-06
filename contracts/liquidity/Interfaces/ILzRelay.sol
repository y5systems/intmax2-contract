// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

// from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol"
struct MessagingReceipt {
    bytes32 guid;
    uint64 nonce;
    MessagingFee fee;
}

struct MessagingFee {
    uint256 nativeFee;
    uint256 lzTokenFee;
}

/**
 * @title LzRelay Interface
 * @notice Interface for the LzRelay contract that is responsible for sending and receiving messages between
 * different chains using LayerZero protocol. It extends the OApp contract to handle cross-chain messaging.
 */
interface ILzRelay {
    /**
    * @notice Error thrown when low level call to Rollup contract fails
    */
    error CallToRollupFailed();

    /**
    * @notice Error thrown when low level call to Liquidity contract fails
    */
    error CallToLiquidityFailed();

    /**
     * @notice Sends a message from the source chain to a destination chain.
     * @param _dstEid The endpoint ID of the destination chain.
     * @param _payload The payload to be sent.
     * @param _options Additional options for message execution.
     * @dev Sends the payload using the `_lzSend` internal function.
     * @return receipt A `MessagingReceipt` struct containing details of the message sent.
     */
    function send(
        uint32 _dstEid,
        bytes memory _payload,
        bytes calldata _options
    ) external payable returns (MessagingReceipt memory receipt);
}