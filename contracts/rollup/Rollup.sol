// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IL2ScrollMessenger} from "@scroll-tech/contracts/L2/IL2ScrollMessenger.sol";
import {IBlockBuilderRegistry} from "../block-builder-registry/IBlockBuilderRegistry.sol";
import {IRollup} from "./IRollup.sol";
import {IPlonkVerifier} from "./IPlonkVerifier.sol";
import {ILiquidity} from "../liquidity/ILiquidity.sol";
import {BlockHashesLib} from "./lib/BlockHashesLib.sol";
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
	using BlockHashesLib for bytes32[];
	using FraudProofPublicInputsLib for FraudProofPublicInputs;
	using WithdrawalLib for Withdrawal;
	using WithdrawalProofPublicInputsLib for WithdrawalProofPublicInputs;
	using Byte32Lib for bytes32;

	IL2ScrollMessenger private l2ScrollMessenger;
	IPlonkVerifier private verifier;
	IBlockBuilderRegistry private blockBuilderRegistry;
	address private liquidity;
	uint256 public lastProcessedWithdrawalId;
	uint256 public lastProcessedDepositId;
	bytes32[] public blockHashes;
	mapping(bytes32 => uint256) private postedBlockHashes;
	Withdrawal[] private withdrawalRequests;
	mapping(bytes32 => bool) private withdrawnTransferHash;
	address[] public postedBlockBuilders;
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
		blockHashes.pushFirstBlockHash();

		postedBlockBuilders.push(address(0));
	}

	function postRegistrationBlock(
		bytes32 txTreeRoot,
		uint128 senderFlags,
		uint256[2] calldata aggregatedPublicKey,
		uint256[4] calldata aggregatedSignature,
		uint256[4] calldata messagePoint,
		uint256[] calldata senderPublicKeys
	) public {
		if (senderPublicKeys.length == 0) {
			revert SenderPublicKeysEmpty();
		}
		bytes32 publicKeysHash = keccak256(abi.encodePacked(senderPublicKeys));
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
		uint128 senderFlags,
		bytes32 publicKeysHash,
		uint256[2] calldata aggregatedPublicKey,
		uint256[4] calldata aggregatedSignature,
		uint256[4] calldata messagePoint,
		bytes calldata senderAccountIds
	) public {
		if (senderAccountIds.length == 0) {
			revert SenderAccountIdsEmpty();
		}
		if (senderAccountIds.length % 5 != 0) {
			revert SenderAccountIdsInvalidLength();
		}
		bytes32 accountIdsHash = keccak256(senderAccountIds);
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
		if (slashedBlockNumbers[publicInputs.blockNumber]) {
			revert FraudProofAlreadySubmitted();
		}

		if (!verifier.Verify(proof, publicInputs.getHash().split())) {
			revert FraudProofVerificationFailed();
		}

		slashedBlockNumbers[publicInputs.blockNumber] = true;
		address blockBuilder = postedBlockBuilders[publicInputs.blockNumber];
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
		uint128 senderFlags,
		bytes32 publicKeysHash,
		bytes32 accountIdsHash,
		uint256[2] calldata aggregatedPublicKey,
		uint256[4] calldata aggregatedSignature,
		uint256[4] calldata messagePoint
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

		blockNumber = blockHashes.length;
		bytes32 prevBlockHash = blockHashes.getPrevHash();
		bytes32 depositTreeRoot = getDepositRoot();
		bytes32 blockHash = blockHashes.pushBlockHash(
			depositTreeRoot,
			signatureHash
		);
		postedBlockBuilders.push(_msgSender());

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
