// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ILiquidity} from "./ILiquidity.sol";

interface IRollup {
    struct Block {
        bytes32 prevBlockHash;
        bytes32 depositTreeRoot;
        bytes32 signatureHash;
    }

    struct Withdrawal {
        address recipient;
        uint32 tokenIndex;
        uint256 amount;
        bytes32 salt;
    }

    event DepositsProcessed(bytes32 depositTreeRoot);

    event BlockPosted(
        bytes32 indexed prevBlockHash,
        address indexed blockBuilder,
        uint256 blockNumber,
        bytes32 depositTreeRoot,
        bytes32 signatureHash
    );

    event BlockFraudProofSubmitted(
        uint32 indexed blockNumber,
        address indexed blockBuilder,
        address indexed challenger
    );

    event WithdrawRequested(
        bytes32 indexed withdrawalRequest,
        address withdrawAggregator
    );

    /**
     * @notice Post new block by Block Builder.
     * @dev Only valid Block Builders can call this function.
     */
    function postBlock(
        bool isRegistrationBlock,
        bytes32 txTreeRoot,
        uint128 senderFlags,
        bytes32 publicKeysHash,
        bytes32 accountIdsHash,
        uint256[2] calldata aggregatedPublicKey,
        uint256[4] calldata aggregatedSignature,
        uint256[4] calldata messagePoint
    ) external returns (uint256 blockNumber);

    function submitBlockFraudProof(
        uint32 blockNumber,
        address blockBuilder,
        uint256[] calldata publicInputs,
        bytes calldata proof
    ) external;

    /**
     * @notice Post the withdrawal requests.
     * @dev This method is called by the Withdraw Aggregator.
     * @param withdrawals The list of withdrawals.
     */
    function postWithdrawalRequests(
        Withdrawal[] calldata withdrawals,
        uint256[] calldata publicInputs,
        bytes calldata proof
    ) external;

    /**
     * @notice Submit the withdrawals.
     * @dev This method is called by the Withdraw Aggregator.
     */
    function submitWithdrawals(uint256 lastProcessedWithdrawId) external;

    /**
     * @notice Update the deposit tree branch and root.
     * @dev Only Liquidity contract can call this function via Scroll Messenger.
     */
    function processDeposits(ILiquidity.Deposit[] calldata deposits) external;

    function getDepositTreeRoot() external view returns (bytes32);

    function getBlockHash(uint32 blockNumber) external view returns (bytes32);

    function getLastProcessedWithdrawalId() external view returns (uint256);
}
