// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IScrollMessenger} from "./IScrollMessenger.sol";
import {IBlockBuilderRegistry} from "./IBlockBuilderRegistry.sol";
import {ILiquidity} from "./ILiquidity.sol";
import {IRollup} from "./IRollup.sol";

contract Rollup is IRollup {
    IScrollMessenger public _scrollMessenger;
    IBlockBuilderRegistry public _blockBuilderRegistry;
    address public _liquidityContract;
    bytes32 public _depositTreeRoot;
    bytes32[] _blockHashes;
    uint256 public _lastProcessedWithdrawId;
    bytes32[] _withdrawalRequests;

    // TODO
    modifier OnlyLiquidityContract() {
        // require(
        //     msg.sender == address(_scrollMessenger),
        //     "This method can only be called from Scroll Messenger."
        // );
        // require(
        //     _liquidityContract ==
        //         IScrollMessenger(_scrollMessenger).xDomainMessageSender()
        // );
        _;
    }

    constructor(
        address scrollMessenger,
        address liquidityContract,
        address blockBuilderRegistry
    ) {
        _scrollMessenger = IScrollMessenger(scrollMessenger);
        _blockBuilderRegistry = IBlockBuilderRegistry(blockBuilderRegistry);
        _liquidityContract = liquidityContract;
        _blockHashes.push(bytes32(0));
    }

    function processDeposits(
        ILiquidity.Deposit[] calldata deposits
    ) public OnlyLiquidityContract {
        bytes32 depositTreeRoot = bytes32(0); // TODO: Calculate the deposit tree root.
        _depositTreeRoot = depositTreeRoot;
    }

    function postBlock(
        bool isRegistrationBlock,
        bytes32 txTreeRoot,
        uint128 senderFlags,
        bytes32 publicKeysHash,
        bytes32 accountIdsHash,
        uint256[2] calldata aggregatedPublicKey,
        uint256[4] calldata aggregatedSignature,
        uint256[4] calldata messagePoint
    ) public returns (uint256 blockNumber) {
        // TODO: Check if the block builder is valid.
        // require(
        //     _blockBuilderRegistry.isValidBlockBuilder(msg.sender),
        //     "Block builder is not valid"
        // );
        bytes32 signatureHash = keccak256(
            abi.encodePacked(
                isRegistrationBlock,
                txTreeRoot,
                senderFlags,
                publicKeysHash,
                accountIdsHash,
                aggregatedPublicKey,
                aggregatedSignature,
                messagePoint
            )
        );

        blockNumber = _blockHashes.length;
        bytes32 prevBlockHash = _blockHashes[blockNumber - 1];
        bytes32 depositTreeRoot = _depositTreeRoot;
        _blockHashes.push(
            _calcBlockHash(
                prevBlockHash,
                depositTreeRoot,
                signatureHash,
                blockNumber
            )
        );

        emit BlockPosted(
            prevBlockHash,
            msg.sender,
            blockNumber,
            depositTreeRoot,
            signatureHash
        );

        return blockNumber;
    }

    function postWithdrawRequests(
        Withdrawal[] calldata withdrawalRequests,
        uint256[] calldata publicInputs,
        bytes calldata proof
    ) public {
        // TODO: Implement the verWithdrawaln logic.
        bytes32 withdrawTreeRoot = 0; // TODO: Calculate the withdrawal tree root from withdrawRequests.

        for (uint256 i = 0; i < withdrawalRequests.length; i++) {
            _withdrawalRequests.push(
                _calcWithdrawalHash(withdrawalRequests[i])
            );
        }

        emit WithdrawRequested(withdrawTreeRoot, msg.sender);
    }

    //
    function submitWithdrawals(uint256 lastProcessedWithdrawId) public {
        require(
            lastProcessedWithdrawId <= _withdrawalRequests.length &&
                lastProcessedWithdrawId > _lastProcessedWithdrawId,
            "Invalid last processed withdrawal ID"
        );
        _lastProcessedWithdrawId = lastProcessedWithdrawId;

        // TODO: Call receiveWithdrawRoot function in Liquidity contract.
    }

    function getDepositTreeRoot() public view returns (bytes32) {
        return _depositTreeRoot;
    }

    function getBlockHash(uint32 blockNumber) public view returns (bytes32) {
        return _blockHashes[blockNumber];
    }

    function getLastProcessedWIthdrawalId() public view returns (uint256) {
        return _lastProcessedWithdrawId;
    }

    function _calcBlockHash(
        bytes32 prevBlockHash,
        bytes32 depositTreeRoot,
        bytes32 signatureHash,
        uint256 blockNumber
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    prevBlockHash,
                    depositTreeRoot,
                    signatureHash,
                    blockNumber
                )
            );
    }

    function _calcWithdrawalHash(
        Withdrawal memory withdrawal
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    withdrawal.recipient,
                    withdrawal.tokenIndex,
                    withdrawal.amount,
                    withdrawal.salt
                )
            );
    }
}
