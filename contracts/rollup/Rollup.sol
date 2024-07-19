// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// interfaces
import {IRollup} from "./IRollup.sol";
import {IBlockBuilderRegistry} from "../block-builder-registry/IBlockBuilderRegistry.sol";
import {IL2ScrollMessenger} from "@scroll-tech/contracts/L2/IL2ScrollMessenger.sol";

// contracts

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// libs
import {DepositTreeLib} from "./lib/DepositTreeLib.sol";
import {BlockLib} from "./lib/BlockLib.sol";

import {Withdrawal} from "./Withdrawal.sol";
import {PairingLib} from "./lib/PairingLib.sol";

contract Rollup is OwnableUpgradeable, UUPSUpgradeable, Withdrawal, IRollup {
	using BlockLib for BlockLib.Block[];
	using DepositTreeLib for DepositTreeLib.DepositTree;

	uint256 private constant NUM_SENDERS_IN_BLOCK = 128;
	uint256 private constant FULL_ACCOUNT_IDS_BYTES = NUM_SENDERS_IN_BLOCK * 5;

	IBlockBuilderRegistry private blockBuilderRegistry;
	address private liquidity;
	uint256 public lastProcessedWithdrawalId;
	uint256 public lastProcessedDepositId;
	BlockLib.Block[] public blocks;

	IL2ScrollMessenger private l2ScrollMessenger;
	DepositTreeLib.DepositTree private depositTree;

	modifier onlyLiquidityContract() {
		// note
		// The specification of ScrollMessenger may change in the future.
		// https://docs.scroll.io/en/developers/l1-and-l2-bridging/the-scroll-messenger/

		// The L2 scrollMessenger is now the sender,
		// but the sendMessage executor of the L1 scrollMessenger will eventually
		// be set as the sender, so the following source needs to be modified at that time
		if (_msgSender() != address(l2ScrollMessenger)) {
			revert OnlyScrollMessenger();
		}
		if (liquidity != l2ScrollMessenger.xDomainMessageSender()) {
			revert OnlyLiquidity();
		}
		_;
	}

	function initialize(
		address _scrollMessenger,
		address _withdrawalVerifier,
		address _liquidity,
		address _blockBuilderRegistry,
		uint256[] calldata _directWithdrawalTokenIndices
	) public initializer {
		__Ownable_init(_msgSender());
		__UUPSUpgradeable_init();
		__Withdrawal_init(
			_scrollMessenger,
			_withdrawalVerifier,
			_liquidity,
			_directWithdrawalTokenIndices
		);
		depositTree.initialize();
		l2ScrollMessenger = IL2ScrollMessenger(_scrollMessenger);
		liquidity = _liquidity;
		blockBuilderRegistry = IBlockBuilderRegistry(_blockBuilderRegistry);

		// The block hash of the genesis block is not referenced during a withdraw request.
		// Therefore, the genesis block is not included in the postedBlockHashes.
		blocks.pushGenesisBlock(depositTree.getRoot());
	}

	function postRegistrationBlock(
		bytes32 txTreeRoot,
		bytes16 senderFlags,
		bytes32[2] calldata aggregatedPublicKey,
		bytes32[4] calldata aggregatedSignature,
		bytes32[4] calldata messagePoint,
		uint256[] calldata senderPublicKeys
	) external {
		uint256 length = senderPublicKeys.length;
		if (length == 0) {
			revert SenderPublicKeysEmpty();
		}
		if (length > NUM_SENDERS_IN_BLOCK) {
			revert TooManySenderPublicKeys();
		}
		uint256 blockNumber = blocks.length;
		emit PubKeysPosted(blockNumber, senderPublicKeys);

		uint256[NUM_SENDERS_IN_BLOCK] memory paddedKeys;
		for (uint256 i = 0; i < length; i++) {
			paddedKeys[i] = senderPublicKeys[i];
		}
		for (uint256 i = length; i < NUM_SENDERS_IN_BLOCK; i++) {
			paddedKeys[i] = 1;
		}
		bytes32 publicKeysHash = keccak256(abi.encodePacked(paddedKeys));
		bytes32 accountIdsHash = 0;
		_postBlock(
			true,
			txTreeRoot,
			senderFlags,
			publicKeysHash,
			accountIdsHash,
			aggregatedPublicKey,
			aggregatedSignature,
			messagePoint
		);
	}

	function postNonRegistrationBlock(
		bytes32 txTreeRoot,
		bytes16 senderFlags,
		bytes32[2] calldata aggregatedPublicKey,
		bytes32[4] calldata aggregatedSignature,
		bytes32[4] calldata messagePoint,
		bytes32 publicKeysHash,
		bytes calldata senderAccountIds
	) external {
		uint256 length = senderAccountIds.length;
		if (length == 0) {
			revert SenderAccountIdsEmpty();
		}
		if (length > FULL_ACCOUNT_IDS_BYTES) {
			revert TooManyAccountIds();
		}
		if (length % 5 != 0) {
			revert SenderAccountIdsInvalidLength();
		}
		uint256 blockNumber = blocks.length;
		emit AccountIdsPosted(blockNumber, senderAccountIds);
		bytes memory paddedAccountIds = new bytes(FULL_ACCOUNT_IDS_BYTES);
		for (uint256 i = 0; i < length; i++) {
			paddedAccountIds[i] = senderAccountIds[i];
		}
		// Pad with 5-byte representation of 1 (0x0000000001)
		for (uint256 i = length; i < FULL_ACCOUNT_IDS_BYTES; i += 5) {
			paddedAccountIds[i + 4] = 0x01;
		}
		bytes32 accountIdsHash = keccak256(paddedAccountIds);

		_postBlock(
			false,
			txTreeRoot,
			senderFlags,
			publicKeysHash,
			accountIdsHash,
			aggregatedPublicKey,
			aggregatedSignature,
			messagePoint
		);
	}

	function processDeposits(
		uint256 _lastProcessedDepositId,
		bytes32[] calldata depositHashes
	) external onlyLiquidityContract {
		for (uint256 i = 0; i < depositHashes.length; i++) {
			depositTree.deposit(depositHashes[i]);
		}
		lastProcessedDepositId = _lastProcessedDepositId;
		emit DepositsProcessed(lastProcessedDepositId, depositTree.getRoot());
	}

	function _postBlock(
		bool isRegistrationBlock,
		bytes32 txTreeRoot,
		bytes16 senderFlags,
		bytes32 publicKeysHash,
		bytes32 accountIdsHash,
		bytes32[2] calldata aggregatedPublicKey,
		bytes32[4] calldata aggregatedSignature,
		bytes32[4] calldata messagePoint
	) internal returns (uint256 blockNumber) {
		bool success = PairingLib.pairing(
			aggregatedPublicKey,
			aggregatedSignature,
			messagePoint
		);
		if (!success) {
			revert PairingCheckFailed();
		}

		bytes32 signatureHash = keccak256(
			abi.encodePacked(
				uint32(isRegistrationBlock ? 1 : 0),
				txTreeRoot,
				senderFlags,
				publicKeysHash,
				accountIdsHash,
				aggregatedPublicKey,
				aggregatedSignature,
				messagePoint
			)
		);

		blockNumber = blocks.length;
		bytes32 prevBlockHash = blocks.getPrevHash();
		bytes32 depositTreeRoot = depositTree.getRoot();

		bytes32 blockHash = blocks.pushBlockInfo(
			depositTreeRoot,
			signatureHash,
			_msgSender()
		);

		// NOTE: Although hash collisions are rare, if a collision does occur, some users may be
		// unable to withdraw. Therefore, we ensure that the block hash does not already exist.
		if (postedBlockHashes[blockHash] != 0) {
			revert BlockHashAlreadyPosted();
		}
		postedBlockHashes[blockHash] = blockNumber;

		emit BlockPosted(
			prevBlockHash,
			_msgSender(),
			blockNumber,
			depositTreeRoot,
			signatureHash
		);

		return blockNumber;
	}

	function getBlockHashAndBuilder(
		uint256 blockNumber
	) external view returns (bytes32, address) {
		BlockLib.Block memory block_ = blocks[blockNumber];
		return (block_.hash, block_.builder);
	}

	function _authorizeUpgrade(address) internal override onlyOwner {}
}
