// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IPlonkVerifier} from "../common/IPlonkVerifier.sol";

contract MockPlonkVerifier is IPlonkVerifier {
	/**
	 * @dev This is a mock implementation of the PlonkVerifier contract.
	 */
	// solhint-disable-next-line func-name-mixedcase
	function Verify(
		bytes calldata,
		uint256[] calldata
	) external pure returns (bool success) {
		return true;
	}
}
