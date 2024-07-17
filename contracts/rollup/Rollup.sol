// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IL2ScrollMessenger} from "@scroll-tech/contracts/L2/IL2ScrollMessenger.sol";
import {IBlockBuilderRegistry} from "../block-builder-registry/IBlockBuilderRegistry.sol";
import {IRollup} from "./IRollup.sol";
import {IPlonkVerifier} from "./IPlonkVerifier.sol";
import {ILiquidity} from "../liquidity/ILiquidity.sol";
import {BlockLib} from "./lib/BlockLib.sol";
import {Byte32Lib} from "./lib/Byte32Lib.sol";
import {FraudProofPublicInputsLib} from "./lib/FraudProofPublicInputsLib.sol";
import {WithdrawalProofPublicInputsLib} from "./lib/WithdrawalProofPublicInputsLib.sol";
import {WithdrawalLib} from "./lib/WithdrawalLib.sol";
import {DepositContract} from "../lib/DepositContract.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Rollup is
	OwnableUpgradeable,
	UUPSUpgradeable,
	DepositContract,
	IRollup
{
	using BlockLib for Block[];
	using FraudProofPublicInputsLib for FraudProofPublicInputs;
	using WithdrawalLib for Withdrawal;
	using WithdrawalProofPublicInputsLib for WithdrawalProofPublicInputs;
	using Byte32Lib for bytes32;

	uint256 constant NUM_SENDERS_IN_BLOCK = 128;
	uint256 constant FULL_ACCOUNT_IDS_BYTES = NUM_SENDERS_IN_BLOCK * 5;

	IL2ScrollMessenger private l2ScrollMessenger;
	IPlonkVerifier private verifier;
	IBlockBuilderRegistry private blockBuilderRegistry;
	address private liquidity;
	uint256 public lastProcessedWithdrawalId;
	uint256 public lastProcessedDepositId;
	Block[] private blocks;
	mapping(bytes32 => uint256) private postedBlockHashes;
	Withdrawal[] private withdrawalRequests;
	mapping(bytes32 => bool) private withdrawnTransferHash;
	//address[] public postedBlockBuilders;
	mapping(uint32 => bool) private slashedBlockNumbers;

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
		address _verifier,
		address _liquidity,
		address _blockBuilderRegistry
	) public initializer {
		__Ownable_init(_msgSender());
		__UUPSUpgradeable_init();
		__ReentrancyGuard_init();
		l2ScrollMessenger = IL2ScrollMessenger(_scrollMessenger);
		verifier = IPlonkVerifier(_verifier);
		liquidity = _liquidity;
		blockBuilderRegistry = IBlockBuilderRegistry(_blockBuilderRegistry);

		// The block hash of the genesis block is not referenced during a withdraw request.
		// Therefore, the genesis block is not included in the postedBlockHashes.
		blocks.pushGenesisBlock(getDepositRoot());
	}

	function postRegistrationBlock(
		bytes32 txTreeRoot,
		bytes16 senderFlags,
		bytes32[2] calldata aggregatedPublicKey,
		bytes32[4] calldata aggregatedSignature,
		bytes32[4] calldata messagePoint,
		uint256[] calldata senderPublicKeys
	) public {
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
	) public {
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
			paddedAccountIds[i] = 0x01;
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

	function submitBlockFraudProof(
		FraudProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) external {
		if (publicInputs.blockHash != blocks[publicInputs.blockNumber].hash) {
			revert BlockHashMismatch({
				given: publicInputs.blockHash,
				expected: blocks[publicInputs.blockNumber].hash
			});
		}

		if (publicInputs.challenger != _msgSender()) {
			revert ChallengerMismatch({
				given: publicInputs.challenger,
				expected: _msgSender()
			});
		}

		if (slashedBlockNumbers[publicInputs.blockNumber]) {
			revert FraudProofAlreadySubmitted();
		}

		if (!verifier.Verify(proof, publicInputs.getHash().split())) {
			revert FraudProofVerificationFailed();
		}

		slashedBlockNumbers[publicInputs.blockNumber] = true;
		address blockBuilder = blocks[publicInputs.blockNumber].builder;
		blockBuilderRegistry.slashBlockBuilder(blockBuilder, _msgSender());

		emit BlockFraudProofSubmitted(
			publicInputs.blockNumber,
			blockBuilder,
			_msgSender()
		);
	}

	function postWithdrawalRequests(
		Withdrawal[] calldata _withdrawalRequests,
		WithdrawalProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) external {
		if (!verifier.Verify(proof, publicInputs.getHash().split())) {
			revert WithdrawalProofVerificationFailed();
		}

		bytes32 withdrawalsHash = 0;
		for (uint256 i = 0; i < _withdrawalRequests.length; i++) {
			if (postedBlockHashes[_withdrawalRequests[i].blockHash] == 0) {
				revert WithdrawalBlockHashNotPosted(i);
			}
			bytes32 transferHash = _withdrawalRequests[i].getHash();
			if (withdrawnTransferHash[transferHash] == true) {
				continue;
			}
			withdrawalRequests.push(_withdrawalRequests[i]);
			withdrawnTransferHash[transferHash] = true;
			withdrawalsHash = keccak256(
				abi.encodePacked(withdrawalsHash, transferHash)
			);
		}

		if (withdrawalsHash != publicInputs.withdrawalsHash) {
			revert WithdrawalsHashMismatch();
		}

		emit WithdrawRequested(publicInputs.withdrawalsHash, _msgSender());
	}

	// pass message to messanger
	function submitWithdrawals(uint256 _lastProcessedWithdrawalId) external {
		if (
			_lastProcessedWithdrawalId <= lastProcessedWithdrawalId ||
			_lastProcessedWithdrawalId > withdrawalRequests.length
		) {
			revert InvalidWithdrawalId();
		}
		Withdrawal[] memory withdrawals = new Withdrawal[](
			_lastProcessedWithdrawalId - lastProcessedWithdrawalId + 1
		);
		uint256 counter = 0;
		for (
			uint256 i = lastProcessedWithdrawalId;
			i <= _lastProcessedWithdrawalId;
			i++
		) {
			withdrawals[counter] = withdrawalRequests[i];
		}
		emit WithdrawalsSubmitted(
			lastProcessedWithdrawalId,
			_lastProcessedWithdrawalId
		);
		lastProcessedWithdrawalId = _lastProcessedWithdrawalId;
		// note
		// The specification of ScrollMessenger may change in the future.
		// https://docs.scroll.io/en/developers/l1-and-l2-bridging/the-scroll-messenger/
		bytes memory message = abi.encodeWithSelector(
			ILiquidity.processWithdrawals.selector,
			withdrawals
		);

		// processWithdrawals is not payable, so value should be 0
		// TODO In the testnet, the gas limit was 0 and there was no problem. In production, it is necessary to check what will happen.
		l2ScrollMessenger.sendMessage{value: 0}( // TODO msg.value is 0, ok?
			liquidity,
			0, // value
			message,
			0, // TODO gaslimit
			_msgSender()
		);
	}

	function processDeposits(
		uint256 _lastProcessedDepositId,
		bytes32[] calldata depositHashes
	) external onlyLiquidityContract {
		for (uint256 i = 0; i < depositHashes.length; i++) {
			_deposit(depositHashes[i]);
		}
		lastProcessedDepositId = _lastProcessedDepositId;
		emit DepositsProcessed(getDepositRoot());
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
		// Check if the block builder is valid.
		if (blockBuilderRegistry.isValidBlockBuilder(_msgSender()) == false) {
			revert InvalidBlockBuilder();
		}
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

		blockNumber = blocks.length;
		bytes32 prevBlockHash = blocks.getPrevHash();
		bytes32 depositTreeRoot = getDepositRoot();
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

	function _authorizeUpgrade(address) internal override onlyOwner {}
}
