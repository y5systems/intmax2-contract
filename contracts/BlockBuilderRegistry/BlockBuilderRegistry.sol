// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IBlockBuilderRegistry} from "./IBlockBuilderRegistry.sol";
import {BlockBuilderInfoLib} from "./BlockBuilderInfoLib.sol";
import {MIN_STAKE_AMOUNT} from "./BlockBuilderRegistryConst.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BlockBuilderRegistry is
	OwnableUpgradeable,
	UUPSUpgradeable,
	IBlockBuilderRegistry
{
	address private rollupContract;
	address private burnAddress = 0x000000000000000000000000000000000000dEaD;
	mapping(address => BlockBuilderInfo) private _blockBuilders;
	using BlockBuilderInfoLib for BlockBuilderInfo;

	/**
	 * @notice Modifier that allows only the rollup contract to call the function.
	 */
	modifier onlyRollupContract() {
		if (_msgSender() != rollupContract) {
			revert OnlyRollupContract();
		}
		_;
	}

	modifier isStaking() {
		if (_blockBuilders[_msgSender()].isStaking() == false) {
			revert BlockBuilderNotFound();
		}
		_;
	}

	/**
	 * @notice Initialize the contract.
	 * @param _rollupContract The address of the rollup contract.
	 */
	function initialize(address _rollupContract) public initializer {
		__Ownable_init(_msgSender());
		__UUPSUpgradeable_init();
		rollupContract = _rollupContract;
	}

	function updateBlockBuilder(string memory url) public payable {
		uint256 stakeAmount = _blockBuilders[_msgSender()].stakeAmount +
			msg.value;
		if (stakeAmount < MIN_STAKE_AMOUNT) {
			revert InsufficientStakeAmount();
		}

		// Update the block builder information.
		_blockBuilders[_msgSender()].blockBuilderUrl = url;
		_blockBuilders[_msgSender()].stakeAmount = stakeAmount;
		_blockBuilders[_msgSender()].stopTime = 0;
		if (_blockBuilders[_msgSender()].isValidBlockBuilder()) {
			_blockBuilders[_msgSender()].isValid = true;
		}

		emit BlockBuilderUpdated(_msgSender(), url, stakeAmount);
	}

	function stopBlockBuilder() public isStaking {
		// Remove the block builder information.
		_blockBuilders[_msgSender()].stopTime = block.timestamp;
		_blockBuilders[_msgSender()].isValid = false;

		emit BlockBuilderStoped(_msgSender());
	}

	function unstake() public isStaking {
		// Check if the last block submission is not within 24 hour.
		if (_blockBuilders[_msgSender()].isChallengeDuration() == false) {
			revert CannotUnstakeWithin24Hours();
		}
		string memory url = _blockBuilders[_msgSender()].blockBuilderUrl;
		uint256 stakeAmount = _blockBuilders[_msgSender()].stakeAmount;

		// Remove the block builder information.
		delete _blockBuilders[_msgSender()];

		// Return the stake amount to the block builder.
		payable(_msgSender()).transfer(stakeAmount);

		emit BlockBuilderUpdated(_msgSender(), url, stakeAmount);
	}

	function slashBlockBuilder(
		address blockBuilder,
		address challenger
	) external onlyRollupContract {
		_blockBuilders[blockBuilder].numSlashes += 1;
		if (
			!_blockBuilders[blockBuilder].isValidBlockBuilder() &&
			_blockBuilders[blockBuilder].isValid
		) {
			_blockBuilders[blockBuilder].isValid = false;
		}
		emit BlockBuilderSlashed(blockBuilder, challenger);
		if (_blockBuilders[blockBuilder].stakeAmount < MIN_STAKE_AMOUNT) {
			// The Block Builder cannot post a block unless it has a minimum amount of stakes,
			// so it does not normally enter into this process.
			uint256 slashAmount = _blockBuilders[blockBuilder].stakeAmount;
			_blockBuilders[blockBuilder].stakeAmount = 0;
			if (slashAmount < MIN_STAKE_AMOUNT / 2) {
				payable(challenger).transfer(slashAmount);
			} else {
				payable(challenger).transfer(MIN_STAKE_AMOUNT / 2);
				payable(burnAddress).transfer(
					slashAmount - (MIN_STAKE_AMOUNT / 2)
				);
			}
			return;
		}
		// solhint-disable-next-line reentrancy
		_blockBuilders[blockBuilder].stakeAmount -= MIN_STAKE_AMOUNT;

		// NOTE: A half of the stake lost by the Block Builder will be burned.
		// This is to prevent the Block Builder from generating invalid blocks and
		// submitting fraud proofs by oneself, which would place a burden on
		// the generation of block validity proofs. An invalid block must prove
		// in the block validity proof that it has been invalidated.
		payable(challenger).transfer(MIN_STAKE_AMOUNT / 2);
		payable(burnAddress).transfer(
			MIN_STAKE_AMOUNT - (MIN_STAKE_AMOUNT / 2)
		);
	}

	function isValidBlockBuilder(
		address blockBuilder
	) public view returns (bool) {
		return _blockBuilders[blockBuilder].isValid;
	}

	function getBlockBuilder(
		address blockBuilder
	) external view returns (BlockBuilderInfo memory) {
		return _blockBuilders[blockBuilder];
	}

	function setBurnAddress(address _burnAddress) external onlyOwner {
		burnAddress = _burnAddress;
	}

	function _authorizeUpgrade(address) internal override onlyOwner {}
}
