// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library PairingLib {
	error PairingOpCodeFailed();

	uint256 internal constant NEG_G1_X = 1;
	uint256 internal constant NEG_G1_Y =
		21888242871839275222246405745257275088696311157297823662689037894645226208581;

	function pairing(
		bytes32[2] calldata aggregatedPublicKey,
		bytes32[4] calldata aggregatedSignature,
		bytes32[4] calldata messagePoint
	) internal view returns (bool) {
		bytes memory input = abi.encodePacked(
			aggregatedPublicKey,
			messagePoint,
			[NEG_G1_X, NEG_G1_Y],
			aggregatedSignature
		);
		uint256[1] memory out;
		bool success;
		uint256 inputSize = input.length;
		assembly {
			success := staticcall(
				sub(gas(), 2000),
				8,
				add(input, 0x20),
				inputSize,
				out,
				0x20
			)
			// Use "invalid" to make gas estimation work
			switch success
			case 0 {
				invalid()
			}
		}
		if (!success) {
			revert PairingOpCodeFailed();
		}
		return out[0] != 0;
	}
}
