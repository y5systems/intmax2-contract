// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IBlockBuilderRegistry} from "../../block-builder-registry/IBlockBuilderRegistry.sol";
import {FraudProofPublicInputsLib} from "../../block-builder-registry/lib/FraudProofPublicInputsLib.sol";

contract SubmitBlockFraudProofReentrancyTest {
	IBlockBuilderRegistry private immutable REGISTRY;

	constructor(address _blockBuilderRegistry) {
		REGISTRY = IBlockBuilderRegistry(_blockBuilderRegistry);
	}

	function submitBlockFraudProof(
		FraudProofPublicInputsLib.FraudProofPublicInputs calldata publicInputs,
		bytes calldata proof
	) external {
		REGISTRY.submitBlockFraudProof(publicInputs, proof);
	}

	// solhint-disable-next-line no-complex-fallback
	receive() external payable {
		FraudProofPublicInputsLib.FraudProofPublicInputs
			memory publicInputs = FraudProofPublicInputsLib
				.FraudProofPublicInputs({
					blockHash: bytes32(
						0x8c835aff939ed6e3ef18dc601bc14623bae8527486ad0539e41a9083e25329be
					),
					blockNumber: 5,
					challenger: address(this)
				});
		bytes memory proof = new bytes(5);
		proof[0] = 0x01;
		proof[1] = 0x02;
		proof[2] = 0x03;
		proof[3] = 0x04;
		proof[4] = 0x05;

		REGISTRY.submitBlockFraudProof(publicInputs, proof);
	}
}
