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
	address private rollup;
	address private burnAddress;
	mapping(address => BlockBuilderInfo) public blockBuilders;
	using BlockBuilderInfoLib for BlockBuilderInfo;

	/**
	 * @notice Modifier that allows only the rollup contract to call the function.
	 */
	modifier onlyRollupContract() {
		if (_msgSender() != rollup) {
			revert OnlyRollupContract();
		}
		_;
	}

	modifier isStaking() {
		if (blockBuilders[_msgSender()].isStaking() == false) {
			revert BlockBuilderNotFound();
		}
		_;
	}

	/**
	 * @notice Initialize the contract.
	 * @param _rollup The address of the rollup contract.
	 */
	function initialize(address _rollup) public initializer {
		__Ownable_init(_msgSender());
		__UUPSUpgradeable_init();
		rollup = _rollup;
		burnAddress = 0x000000000000000000000000000000000000dEaD;
	}

	function updateBlockBuilder(string memory url) public payable {
		BlockBuilderInfo memory info = blockBuilders[_msgSender()];
		uint256 stakeAmount = info.stakeAmount + msg.value;
		if (stakeAmount < MIN_STAKE_AMOUNT) {
			revert InsufficientStakeAmount();
		}
		info.blockBuilderUrl = url;
		info.stakeAmount = stakeAmount;
		info.stopTime = 0;
		info.isValid = true;
		blockBuilders[_msgSender()] = info;

		emit BlockBuilderUpdated(_msgSender(), url, stakeAmount);
	}

	function stopBlockBuilder() public isStaking {
		// Remove the block builder information.
		BlockBuilderInfo memory info = blockBuilders[_msgSender()];
		info.stopTime = block.timestamp;
		info.isValid = false;
		blockBuilders[_msgSender()] = info;

		emit BlockBuilderStopped(_msgSender());
	}

	function unstake() public isStaking {
		// Check if the last block submission is not within 24 hour.
		BlockBuilderInfo memory info = blockBuilders[_msgSender()];
		if (info.isChallengeDuration() == false) {
			revert CannotUnstakeWithinChallengeDuration();
		}
		string memory url = info.blockBuilderUrl;
		uint256 stakeAmount = info.stakeAmount;

		// Remove the block builder information.
		delete blockBuilders[_msgSender()];

		// Return the stake amount to the block builder.
		payable(_msgSender()).transfer(stakeAmount);

		emit BlockBuilderUpdated(_msgSender(), url, stakeAmount);
	}

	function slashBlockBuilder(
		address blockBuilder,
		address challenger
	) external onlyRollupContract {
		BlockBuilderInfo memory info = blockBuilders[blockBuilder];
		if (info.isStaking() == false) {
			revert BlockBuilderNotFound();
		}
		info.numSlashes += 1;
		if (!info.isStakeAmountSufficient() && info.isValid) {
			info.isValid = false;
		}
		emit BlockBuilderSlashed(blockBuilder, challenger);
		if (info.stakeAmount < MIN_STAKE_AMOUNT) {
			// The Block Builder cannot post a block unless it has a minimum amount of stakes,
			// so it does not normally enter into this process.
			uint256 slashAmount = info.stakeAmount;
			info.stakeAmount = 0;
			blockBuilders[blockBuilder] = info;
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
		info.stakeAmount -= MIN_STAKE_AMOUNT;
		// solhint-disable-next-line reentrancy
		blockBuilders[blockBuilder] = info;

		// NOTE: A half of the stake lost by the Block Builder will be burned.
		// This is to prevent the Block Builder from generating invalid blocks and
		// submitting fraud proofs by oneself, which would place a burden on
		// the generation of block validity proofs. An invalid block must prove
		// in the block validity proof that it has been invalidated.
		payable(challenger).transfer(MIN_STAKE_AMOUNT / 2);
		payable(burnAddress).transfer(MIN_STAKE_AMOUNT / 2);
	}

	function isValidBlockBuilder(
		address blockBuilder
	) public view returns (bool) {
		return blockBuilders[blockBuilder].isValid;
	}

	function setBurnAddress(address _burnAddress) external onlyOwner {
		burnAddress = _burnAddress;
	}

	function _authorizeUpgrade(address) internal override onlyOwner {}
}
