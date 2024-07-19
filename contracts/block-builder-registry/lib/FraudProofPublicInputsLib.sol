// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library FraudProofPublicInputsLib {
	struct FraudProofPublicInputs {
		bytes32 blockHash;
		uint32 blockNumber;
		address challenger;
	}

	function getHash(
		FraudProofPublicInputs memory inputs
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
