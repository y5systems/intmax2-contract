// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library Byte32Lib {
	function split(bytes32 input) internal pure returns (uint256[] memory) {
		uint256[] memory parts = new uint256[](8);
		for (uint256 i = 0; i < 8; i++) {
			parts[i] = uint256(uint32(bytes4(input << (i * 32))));
		}
		return parts;
	}
}
