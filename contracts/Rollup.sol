// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IScrollMessenger} from "./IScrollMessenger.sol";
import {IBlockBuilderRegistry} from "./IBlockBuilderRegistry.sol";
import {ILiquidity} from "./ILiquidity.sol";
import {IRollup} from "./IRollup.sol";

contract Rollup is IRollup {
    IScrollMessenger public _scrollMessenger;
    IBlockBuilderRegistry public _blockBuilderRegistryContract;
    address public _liquidityContract;
    bytes32 _depositTreeRoot;
    bytes32[] _depositTreeSiblings;
    bytes32[] _blockHashes;
    uint256 _lastProcessedWithdrawId;
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
        address scrollMessenger
    ) {
        _initialize(scrollMessenger);
    }

    function updateDependentContract(address liquidityContract, address blockBuilderRegistryContract) external {
        _liquidityContract = liquidityContract;
        _blockBuilderRegistryContract = IBlockBuilderRegistry(blockBuilderRegistryContract);
    }

    function processDeposits(
        ILiquidity.Deposit[] calldata deposits
    ) public OnlyLiquidityContract {
        // for (uint256 i = 0; i < deposits.length; i++) {
        //     _addLeafHash(
        //         keccak256(
        //             abi.encodePacked(
        //                 deposits[i].recipientSaltHash,
        //                 deposits[i].tokenIndex,
        //                 deposits[i].amount
        //             )
        //         )
        //     );
        // }

        // // Calculate the deposit tree root.
        // bytes32 depositTreeRoot = getMerkleRoot();
        bytes32 depositTreeRoot = 0;

        _depositTreeRoot = depositTreeRoot;


        emit DepositsProcessed(depositTreeRoot);
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
        // Check if the block builder is valid.
        require(
            _blockBuilderRegistryContract.isValidBlockBuilder(msg.sender),
            "Block builder is not valid"
        );
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

    function submitBlockFraudProof(
        uint32 blockNumber,
        address blockBuilder,
        uint256[] calldata publicInputs,
        bytes calldata proof
    ) public {
        _blockBuilderRegistryContract.slashBlockBuilder(blockNumber, blockBuilder, msg.sender);

        emit BlockFraudProofSubmitted(blockNumber, blockBuilder, msg.sender);
    }

    function postWithdrawalRequests(
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

    function submitWithdrawals(uint256 lastProcessedWithdrawId) public {
        // NOTE: Commented out for the debugging purpose.
        // require(
        //     lastProcessedWithdrawId <= _withdrawalRequests.length &&
        //         lastProcessedWithdrawId > _lastProcessedWithdrawId,
        //     "Invalid last processed withdrawal ID"
        // );
        _lastProcessedWithdrawId = lastProcessedWithdrawId;

        // TODO: Call processWithdrawals function in Liquidity contract.
    }

    function getDepositTreeRoot() public view returns (bytes32) {
        return _depositTreeRoot;
    }

    function getBlockHash(uint32 blockNumber) public view returns (bytes32) {
        return _blockHashes[blockNumber];
    }

    function getLastProcessedWithdrawalId() public view returns (uint256) {
        return _lastProcessedWithdrawId;
    }

    function _initialize(
        address scrollMessenger
    ) internal {
        _scrollMessenger = IScrollMessenger(scrollMessenger);
        _blockHashes.push(bytes32(0));
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
