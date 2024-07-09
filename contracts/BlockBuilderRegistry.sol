// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IBlockBuilderRegistry} from "./IBlockBuilderRegistry.sol";

contract BlockBuilderRegistry is IBlockBuilderRegistry {
	uint256 public constant MIN_STAKE_AMOUNT = 100000000 wei; // TODO: 0.1 ether
	uint256 public constant CHALLENGE_DURATION = 5 seconds; // TODO: 1 days
	address _rollupContract;
	address _burnAddress = 0x000000000000000000000000000000000000dEaD;

	mapping(address => BlockBuilderInfo) _blockBuilders;

	modifier OnlyRollupContract() {
		require(
			msg.sender == address(_rollupContract),
			"This method can only be called from Rollup contract."
		);
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
		if (_isValidBlockBuilder(msg.sender)) {
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
		address blockBuilder,
		address challenger
	) external OnlyRollupContract {
		_blockBuilders[blockBuilder].numSlashes += 1;
		if (
			!_isValidBlockBuilder(blockBuilder) &&
			_blockBuilders[blockBuilder].isValid
		) {
			_blockBuilders[blockBuilder].isValid = false;
		}

		if (_blockBuilders[blockBuilder].stakeAmount < MIN_STAKE_AMOUNT) {
			// The Block Builder cannot post a block unless it has a minimum amount of stakes,
			// so it does not normally enter into this process.
			uint256 slashAmount = _blockBuilders[blockBuilder].stakeAmount;
			_blockBuilders[blockBuilder].stakeAmount = 0;
			if (slashAmount < MIN_STAKE_AMOUNT / 2) {
				payable(challenger).transfer(slashAmount);
			} else {
				payable(challenger).transfer(MIN_STAKE_AMOUNT / 2);
				payable(_burnAddress).transfer(
					slashAmount - (MIN_STAKE_AMOUNT / 2)
				);
			}
		} else {
			_blockBuilders[blockBuilder].stakeAmount -= MIN_STAKE_AMOUNT;

			// NOTE: A half of the stake lost by the Block Builder will be burned.
			// This is to prevent the Block Builder from generating invalid blocks and
			// submitting fraud proofs by oneself, which would place a burden on
			// the generation of block validity proofs. An invalid block must prove
			// in the block validity proof that it has been invalidated.
			payable(challenger).transfer(MIN_STAKE_AMOUNT / 2);
			payable(_burnAddress).transfer(
				MIN_STAKE_AMOUNT - (MIN_STAKE_AMOUNT / 2)
			);
		}

		emit BlockBuilderSlashed(blockBuilder, challenger);
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
