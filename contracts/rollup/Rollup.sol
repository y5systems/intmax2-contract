// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IScrollMessenger} from "@scroll-tech/contracts/libraries/IScrollMessenger.sol";
import {IBlockBuilderRegistry} from "../block-builder-registry/IBlockBuilderRegistry.sol";
import {IRollup} from "./IRollup.sol";
import {IPlonkVerifier} from "../IPlonkVerifier.sol";
import {BlockHashesLib} from "./lib/BlockHashesLib.sol";
import {Byte32Lib} from "./lib/Byte32Lib.sol";
import {FraudProofPublicInputsLib} from "./lib/FraudProofPublicInputsLib.sol";
import {WithdrawalProofPublicInputsLib} from "./lib/WithdrawalProofPublicInputsLib.sol";
import {WithdrawalLib} from "./lib/WithdrawalLib.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Rollup is OwnableUpgradeable, UUPSUpgradeable, IRollup {
	IScrollMessenger private scrollMessenger;
	IPlonkVerifier private verifier;
	IBlockBuilderRegistry private blockBuilderRegistry;
	address private liquidity;
	bytes32[] private blockHashes;
	bytes32 private depositTreeRoot;
	bytes32[] private withdrawalRequests;
	using BlockHashesLib for bytes32[];
	using FraudProofPublicInputsLib for FraudProofPublicInputs;
	using WithdrawalLib for Withdrawal;
	using WithdrawalProofPublicInputsLib for WithdrawalProofPublicInputs;
	using Byte32Lib for bytes32;

	bytes32[] private _depositTreeSiblings;
	uint256 private _lastProcessedWithdrawId;

	uint256 private _lastProcessedDepositId;
	mapping(uint32 => bool) private slashedBlockNumbers;

	// TODO
	modifier OnlyLiquidityContract() {
		// require(
		//     _msgSender() == address(_scrollMessenger),
		//     "This method can only be called from Scroll Messenger."
		// );
		// require(
		//     _liquidityContract ==
		//         IScrollMessenger(_scrollMessenger).xDomainMessageSender()
		// );
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
		scrollMessenger = IScrollMessenger(_scrollMessenger);
		verifier = IPlonkVerifier(_verifier);
		liquidity = _liquidity;
		blockBuilderRegistry = IBlockBuilderRegistry(_blockBuilderRegistry);
		blockHashes.pushFirstBlockHash();
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
		blockHashes.pushBlockHash(depositTreeRoot, signatureHash);

		emit BlockPosted(
			prevBlockHash,
			_msgSender(),
			blockNumber,
			depositTreeRoot,
			signatureHash
		);

		return blockNumber;
	}

	function submitBlockFraudProof(
		FraudProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) public {
		if (slashedBlockNumbers[publicInputs.blockNumber]) {
			revert FraudProofAlreadySubmitted();
		}

		if (!verifier.Verify(proof, publicInputs.getHash().split())) {
			revert FraudProofVerificationFailed();
		}

		slashedBlockNumbers[publicInputs.blockNumber] = true;
		blockBuilderRegistry.slashBlockBuilder(
			publicInputs.blockBuilder,
			_msgSender()
		);

		emit BlockFraudProofSubmitted(
			publicInputs.blockNumber,
			publicInputs.blockBuilder,
			_msgSender()
		);
	}

	function postWithdrawalRequests(
		Withdrawal[] calldata _withdrawalRequests,
		WithdrawalProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) public {
		if (!verifier.Verify(proof, publicInputs.getHash().split())) {
			revert WithdrawalProofVerificationFailed();
		}

		// TODO: Calculate the withdrawal tree root from withdrawRequests.

		bytes32 withdrawalTreeRoot = publicInputs.withdrawalTreeRoot;

		for (uint256 i = 0; i < _withdrawalRequests.length; i++) {
			withdrawalRequests.push(_withdrawalRequests[i].getHash());
		}

		emit WithdrawRequested(withdrawalTreeRoot, _msgSender());
	}

	function processDeposits(
		uint256 lastProcessedDepositId,
		bytes32[] calldata depositHashes
	) public OnlyLiquidityContract {
		// for (uint256 i = 0; i < deposits.length; i++) {
		//     _deposit(depositHashes);
		// }

		// // Calculate the deposit tree root.
		// bytes32 depositTreeRoot = getDepositRoot();
		bytes32 depositTreeRootTmp = 0;

		depositTreeRoot = depositTreeRootTmp;
		_lastProcessedDepositId = lastProcessedDepositId;

		emit DepositsProcessed(depositTreeRootTmp);
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
		return depositTreeRoot;
	}

	function getBlockHash(uint32 blockNumber) public view returns (bytes32) {
		return blockHashes[blockNumber];
	}

	function getLastProcessedWithdrawalId() public view returns (uint256) {
		return _lastProcessedWithdrawId;
	}

	function getLastProcessedDepositId() public view returns (uint256) {
		return _lastProcessedDepositId;
	}

	function _authorizeUpgrade(address) internal override onlyOwner {}
}

// updateDependentContractは削除した
//   liquidity、blockBuilderRegistry共にプロキシパターンであるため、
//   一度決まったアドレスは変更されない確率が高い
//   もし変更されるなら、Rollupコントラクト自体もプロキシパターンであるため、
//   それらを更新する関数をあらたに作ればいいと思ったから
