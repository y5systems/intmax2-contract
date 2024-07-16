// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IRollup} from "../IRollup.sol";

library FraudProofPublicInputsLib {
	function getHash(
		IRollup.FraudProofPublicInputs memory inputs
	) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					inputs.blockHash,
					inputs.blockNumber,
					inputs.challenger
				)
			);
	}
}
