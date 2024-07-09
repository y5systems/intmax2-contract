// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IPlonkVerifier {
	/// Verify a Plonk proof.
	/// Reverts if the proof or the public inputs are malformed.
	/// @param proof serialised plonk proof (using gnark's MarshalSolidity)
	/// @param public_inputs (must be reduced)
	/// @return success true if the proof passes false otherwise
	function Verify(
		bytes calldata proof,
		uint256[] calldata public_inputs
	) external view returns (bool success);
}
