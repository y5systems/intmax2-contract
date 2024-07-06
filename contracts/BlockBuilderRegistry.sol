// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IBlockBuilderRegistry} from "./IBlockBuilderRegistry.sol";

contract BlockBuilderRegistry is IBlockBuilderRegistry {
    uint256 public constant MIN_STAKE_AMOUNT = 100000000 wei; // TODO: 0.1 ether
    uint256 public constant CHALLENGE_DURATION = 5 seconds; // TODO: 1 days
    address _rollupContract;

    mapping(address => BlockBuilderInfo) _blockBuilders;

    modifier OnlyRollupContract() {
        // require(
        //     msg.sender == address(_rollupContract),
        //     "This method can only be called from Rollup contract."
        // );
        _;
    }

    constructor(address rollupContract) {
        _rollupContract = rollupContract;
    }

    function updateBlockBuilder(string memory url) public payable {
        uint256 stakeAmount = _blockBuilders[msg.sender].stakeAmount +
            msg.value;
        require(stakeAmount >= MIN_STAKE_AMOUNT, "Insufficient stake amount");

        // Update the block builder information.
        _blockBuilders[msg.sender].blockBuilderUrl = url;
        _blockBuilders[msg.sender].stakeAmount = stakeAmount;
        _blockBuilders[msg.sender].stopTime = 0;
        if (
            _isValidBlockBuilder(msg.sender)
        ) {
            _blockBuilders[msg.sender].isValid = true;
        }

        emit BlockBuilderUpdated(msg.sender, url, stakeAmount);
    }

    function stopBlockBuilder() public {
        require(
            _blockBuilders[msg.sender].stakeAmount != 0,
            "Block builder not found"
        );

        // Remove the block builder information.
        _blockBuilders[msg.sender].stopTime = block.timestamp;
        _blockBuilders[msg.sender].isValid = false;

        emit BlockBuilderStoped(msg.sender);
    }

    function unstake() public {
        require(
            _blockBuilders[msg.sender].stakeAmount != 0,
            "Block builder not found"
        );

        // Check if the last block submission is not within 24 hour.
        require(
            block.timestamp - _blockBuilders[msg.sender].stopTime >=
                CHALLENGE_DURATION,
            "Cannot unstake within one day of the last block submission"
        );
        string memory url = _blockBuilders[msg.sender].blockBuilderUrl;
        uint256 stakeAmount = _blockBuilders[msg.sender].stakeAmount;

        // Remove the block builder information.
        delete _blockBuilders[msg.sender];

        // Return the stake amount to the block builder.
        payable(msg.sender).transfer(stakeAmount);

        emit BlockBuilderUpdated(msg.sender, url, stakeAmount);
    }

    function slashBlockBuilder(
        uint32 blockNumber,
        address blockBuilder,
        address challenger
    ) external OnlyRollupContract {
        // TODO: Implement the slashing logic.

        _blockBuilders[blockBuilder].numSlashes += 1;
        if (
            !_isValidBlockBuilder(blockBuilder) &&
            _blockBuilders[blockBuilder].isValid
        ) {
            _blockBuilders[blockBuilder].isValid = false;
        }
    }

    function isValidBlockBuilder(
        address blockBuilder
    ) public view returns (bool) {
        return _blockBuilders[blockBuilder].isValid;
    }

    function getBlockBuilder(
        address blockBuilder
    ) public view returns (BlockBuilderInfo memory) {
        return _blockBuilders[blockBuilder];
    }

    function _isValidBlockBuilder(
        address blockBuilder
    ) internal view returns (bool) {
        return _blockBuilders[blockBuilder].stakeAmount >= MIN_STAKE_AMOUNT;
    }
}
