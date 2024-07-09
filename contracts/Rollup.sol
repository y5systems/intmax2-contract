// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IScrollMessenger} from "@scroll-tech/contracts/libraries/IScrollMessenger.sol";
import {IBlockBuilderRegistry} from "./IBlockBuilderRegistry.sol";
import {ILiquidity} from "./ILiquidity.sol";
import {IRollup} from "./IRollup.sol";
import {IPlonkVerifier} from "./IPlonkVerifier.sol";

contract Rollup is IRollup {
	IScrollMessenger public _scrollMessenger;
	IPlonkVerifier public _verifierAddress;
	IBlockBuilderRegistry public _blockBuilderRegistryContract;
	address public _liquidityContract;
	bytes32 _depositTreeRoot;
	bytes32[] _depositTreeSiblings;
	bytes32[] _blockHashes;
	uint256 _lastProcessedWithdrawId;
	bytes32[] _withdrawalRequests;
	uint256 _lastProcessedDepositId;
	mapping(uint32 => bool) _slashedBlockNumbers;

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

	constructor(address scrollMessenger, address verifierAddress) {
		_initialize(scrollMessenger, verifierAddress);
	}

	function updateDependentContract(
		address liquidityContract,
		address blockBuilderRegistryContract
	) external {
		_liquidityContract = liquidityContract;
		_blockBuilderRegistryContract = IBlockBuilderRegistry(
			blockBuilderRegistryContract
		);
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
		bytes32 depositTreeRoot = 0;

		_depositTreeRoot = depositTreeRoot;
		_lastProcessedDepositId = lastProcessedDepositId;

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
		FraudProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) public {
		if (_slashedBlockNumbers[publicInputs.blockNumber]) {
			revert FraudProofAlreadySubmitted();
		}

		bytes32 pisHash = _getFraudProofPublicInputsHash(publicInputs);
		if (!_verifierAddress.Verify(proof, _splitBytes32(pisHash))) {
			revert FraudProofVerificationFailed();
		}

		_slashedBlockNumbers[publicInputs.blockNumber] = true;
		_blockBuilderRegistryContract.slashBlockBuilder(
			publicInputs.blockBuilder,
			msg.sender
		);

		emit BlockFraudProofSubmitted(
			publicInputs.blockNumber,
			publicInputs.blockBuilder,
			msg.sender
		);
	}

	function _getFraudProofPublicInputsHash(
		FraudProofPublicInputs memory publicInputs
	) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					publicInputs.blockHash,
					publicInputs.blockNumber,
					publicInputs.blockBuilder,
					publicInputs.challenger
				)
			);
	}

	function _splitBytes32(
		bytes32 input
	) internal pure returns (uint256[] memory) {
		uint256[] memory parts = new uint256[](8);
		for (uint256 i = 0; i < 8; i++) {
			parts[i] = uint256(uint32(bytes4(input << (i * 32))));
		}
		return parts;
	}

	function postWithdrawalRequests(
		Withdrawal[] calldata withdrawalRequests,
		WithdrawalProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) public {
		bytes32 pisHash = _getWithdrawalProofPublicInputsHash(publicInputs);
		if (!_verifierAddress.Verify(proof, _splitBytes32(pisHash))) {
			revert WithdrawalProofVerificationFailed();
		}

		// TODO: Calculate the withdrawal tree root from withdrawRequests.

		bytes32 withdrawalTreeRoot = publicInputs.withdrawalTreeRoot;

		for (uint256 i = 0; i < withdrawalRequests.length; i++) {
			_withdrawalRequests.push(
				_calcWithdrawalHash(withdrawalRequests[i])
			);
		}

		emit WithdrawRequested(withdrawalTreeRoot, msg.sender);
	}

	function _getWithdrawalProofPublicInputsHash(
		WithdrawalProofPublicInputs memory publicInputs
	) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					publicInputs.withdrawalTreeRoot,
					publicInputs.withdrawalAggregator
				)
			);
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

	function getLastProcessedDepositId() public view returns (uint256) {
		return _lastProcessedDepositId;
	}

	function _initialize(
		address scrollMessenger,
		address verifierAddress
	) internal {
		_scrollMessenger = IScrollMessenger(scrollMessenger);
		_verifierAddress = IPlonkVerifier(verifierAddress);
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
