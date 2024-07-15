// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IRollup} from "../IRollup.sol";

library WithdrawalProofPublicInputsLib {
	function getHash(
		IRollup.WithdrawalProofPublicInputs memory inputs
	) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					inputs.withdrawalsHash,
					inputs.withdrawalAggregator
				)
			);
	}
}
