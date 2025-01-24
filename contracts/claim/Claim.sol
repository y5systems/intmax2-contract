// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IClaim} from "./IClaim.sol";
import {IPlonkVerifier} from "../common/IPlonkVerifier.sol";
import {ILiquidity} from "../liquidity/ILiquidity.sol";
import {IRollup} from "../rollup/IRollup.sol";
import {IContribution} from "../contribution/IContribution.sol";
import {IL2ScrollMessenger} from "@scroll-tech/contracts/L2/IL2ScrollMessenger.sol";

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {ClaimProofPublicInputsLib} from "./lib/ClaimProofPublicInputsLib.sol";
import {ChainedClaimLib} from "./lib/ChainedClaimLib.sol";
import {WithdrawalLib} from "../common/WithdrawalLib.sol";
import {Byte32Lib} from "../common/Byte32Lib.sol";

contract Claim is IClaim, UUPSUpgradeable, OwnableUpgradeable {
	using EnumerableSet for EnumerableSet.UintSet;
	using WithdrawalLib for WithdrawalLib.Withdrawal;
	using ChainedClaimLib for ChainedClaimLib.ChainedClaim[];
	using ClaimProofPublicInputsLib for ClaimProofPublicInputsLib.ClaimProofPublicInputs;
	using Byte32Lib for bytes32;

	IPlonkVerifier private claimVerifier;
	IL2ScrollMessenger private l2ScrollMessenger;
	IRollup private rollup;
	address private liquidity;
	IContribution private contribution;
	mapping(bytes32 => bool) private nullifiers;

	/// @custom:oz-upgrades-unsafe-allow constructor
	constructor() {
		_disableInitializers();
	}

	function initialize(
		address _admin,
		address _scrollMessenger,
		address _claimVerifier,
		address _liquidity,
		address _rollup,
		address _contribution
	) external initializer {
		if (_admin == address(0)) {
			revert AddressZero();
		}
		if (_scrollMessenger == address(0)) {
			revert AddressZero();
		}
		if (_claimVerifier == address(0)) {
			revert AddressZero();
		}
		if (_liquidity == address(0)) {
			revert AddressZero();
		}
		if (_rollup == address(0)) {
			revert AddressZero();
		}
		if (_contribution == address(0)) {
			revert AddressZero();
		}
		__Ownable_init(_admin);
		__UUPSUpgradeable_init();
		l2ScrollMessenger = IL2ScrollMessenger(_scrollMessenger);
		claimVerifier = IPlonkVerifier(_claimVerifier);
		rollup = IRollup(_rollup);
		contribution = IContribution(_contribution);
		liquidity = _liquidity;
	}

	function submitClaimProof(
		ChainedClaimLib.ChainedClaim[] calldata claims,
		ClaimProofPublicInputsLib.ClaimProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) external {
		_validateClaimProof(claims, publicInputs, proof);
		uint256 counter = 0;
		bool[] memory isSkippedFlags = new bool[](claims.length);
		for (uint256 i = 0; i < claims.length; i++) {
			ChainedClaimLib.ChainedClaim memory chainedWithdrawal = claims[i];
			if (nullifiers[chainedWithdrawal.nullifier]) {
				isSkippedFlags[i] = true;
				continue; // already withdrawn
			}
			nullifiers[chainedWithdrawal.nullifier] = true;
			bytes32 expectedBlockHash = rollup.getBlockHash(
				chainedWithdrawal.blockNumber
			);
			if (expectedBlockHash != chainedWithdrawal.blockHash) {
				revert BlockHashNotExists(chainedWithdrawal.blockHash);
			}
			counter++;
		}
		if (counter == 0) {
			return;
		}
		WithdrawalLib.Withdrawal[]
			memory directWithdrawals = new WithdrawalLib.Withdrawal[](counter);

		uint256 index = 0;
		for (uint256 i = 0; i < claims.length; i++) {
			if (isSkippedFlags[i]) {
				continue; // skipped claim
			}
			ChainedClaimLib.ChainedClaim memory chainedClaim = claims[i];
			WithdrawalLib.Withdrawal memory withdrawal = WithdrawalLib
				.Withdrawal(
					chainedClaim.recipient,
					1,
					chainedClaim.amount,
					chainedClaim.nullifier
				);
			emit DirectWithdrawalQueued(
				withdrawal.getHash(),
				withdrawal.recipient,
				withdrawal
			);
			index++;
		}

		bytes memory message = abi.encodeWithSelector(
			ILiquidity.processWithdrawals.selector,
			directWithdrawals,
			new WithdrawalLib.Withdrawal[](0)
		);
		_relayMessage(message);

		contribution.recordContribution(
			keccak256("CLAIM"),
			_msgSender(),
			counter
		);
	}

	// The specification of ScrollMessenger may change in the future.
	// https://docs.scroll.io/en/developers/l1-and-l2-bridging/the-scroll-messenger/
	function _relayMessage(bytes memory message) private {
		uint256 value = 0; // relay to non-payable function
		// In the current implementation of ScrollMessenger, the `gasLimit` is simply included in the L2 event log
		// and does not impose any restrictions on the L1 gas limit. However, considering the possibility of
		// future implementation changes, we will specify a maximum value.
		uint256 gasLimit = type(uint256).max;
		l2ScrollMessenger.sendMessage{value: value}(
			liquidity,
			value,
			message,
			gasLimit,
			_msgSender()
		);
	}

	function _validateClaimProof(
		ChainedClaimLib.ChainedClaim[] calldata claims,
		ClaimProofPublicInputsLib.ClaimProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) private view {
		if (!claims.verifyClaimChain(publicInputs.lastClaimHash)) {
			revert ClaimChainVerificationFailed();
		}
		if (publicInputs.claimAggregator != _msgSender()) {
			revert ClaimAggregatorMismatch();
		}
		if (!claimVerifier.Verify(proof, publicInputs.getHash().split())) {
			revert ClaimProofVerificationFailed();
		}
	}

	function _authorizeUpgrade(address) internal override onlyOwner {}
}
