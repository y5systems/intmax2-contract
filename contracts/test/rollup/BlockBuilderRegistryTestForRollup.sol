// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract BlockBuilderRegistryTestForRollup {
	bool public result;

	function setResult(
		bool _result
	) external {
		result = _result;
	}

	function isValidBlockBuilder(
		address 
	) external view returns (bool) {
		return result;
	}
}
