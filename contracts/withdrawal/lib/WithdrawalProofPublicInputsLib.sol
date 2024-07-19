// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library WithdrawalProofPublicInputsLib {
	struct WithdrawalProofPublicInputs {
		bytes32 lastWithdrawalHash;
		address withdrawalAggregator;
	}

	function getHash(
		WithdrawalProofPublicInputs memory inputs
	) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					inputs.lastWithdrawalHash,
					inputs.withdrawalAggregator
				)
			);
	}
}
