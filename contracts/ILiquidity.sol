// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IRollup} from "./IRollup.sol";

interface ILiquidity {
    enum TokenType {
        ETH,
        ERC20,
        ERC721,
        ERC1155
    }

    struct TokenInfo {
        TokenType tokenType;
        address tokenAddress;
        uint256 tokenId;
    }

    struct Deposit {
        bytes32 recipientSaltHash;
        uint32 tokenIndex;
        uint256 amount;
    }

    struct DepositData {
        bytes32 depositHash;
        address sender;
        uint256 requestedAt; // TODO: remove this
    }

    event Deposited(
        uint256 indexed depositId,
        address indexed sender,
        bytes32 recipientSaltHash,
        uint32 tokenIndex,
        uint256 amount,
        uint256 requestedAt
    );

    event DepositCanceled(uint256 indexed depositId);

    event DepositsRejected(uint256 indexed lastAnalyzedDepositId);

    event DepositsSubmitted(uint256 indexed lastProcessedDepositId);

    function depositETH(bytes32 recipientSaltHash) external payable;

    function depositERC20(
        address tokenAddress,
        bytes32 recipientSaltHash,
        uint256 amount
    ) external;

    function depositERC721(
        address tokenAddress,
        bytes32 recipientSaltHash,
        uint256 tokenId
    ) external;

    function depositERC1155(
        address tokenAddress,
        bytes32 recipientSaltHash,
        uint256 tokenId,
        uint256 amount
    ) external;

    function cancelPendingDeposit(
        uint256 depositId,
        Deposit memory deposit
    ) external;

    function claimRejectedDeposit(
        uint256 depositId,
        Deposit memory deposit
    ) external;

    /**
     * @param lastAnalyzedDepositId The last deposit ID that was analyzed
     * @param rejectedDepositIds The list of deposit IDs that were rejected
     */
    function rejectDeposits(
        uint256 lastAnalyzedDepositId,
        uint256[] calldata rejectedDepositIds
    ) external;

    /**
     * @notice Submit the deposit root
     */
    function submitDeposits(uint256 lastProcessedDepositId) external payable;

    /**
     * @notice Process the withdrawals.
     * @dev This method is called by the Rollup contract via Scroll Messenger.
     * @param withdrawals The list of withdrawals to process
     */
    function processWithdrawals(
        IRollup.Withdrawal[] calldata withdrawals
    ) external;

    function claimWithdrawals(uint256[] calldata withdrawalIds) external;

    function getDepositCounter() external view returns (uint256);

    function getPendingDeposit(
        uint256 depositId
    ) external view returns (DepositData memory);

    function getRejectedDeposit(
        uint256 depositId
    ) external view returns (DepositData memory);

    function getLastAnalyzedDepositId() external view returns (uint256);

    function getLastProcessedDepositId() external view returns (uint256);
}
