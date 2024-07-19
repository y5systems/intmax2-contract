// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract RollupTestForBlockBuilderRegistory {
	struct Result {
		bytes32 testHash;
		address testAddress;
	}
	mapping(uint256 => Result) private results;
	function setTestData(
		uint256 key,
		bytes32 _hash,
		address _address
	) external {
		results[key] = Result(_hash, _address);
	}
	function getBlockHashAndBuilder(
		uint256 _key
	) external view returns (bytes32, address) {
		return (results[_key].testHash, results[_key].testAddress);
	}
}
