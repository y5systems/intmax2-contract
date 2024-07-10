// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library BlockHashesLib {
	function pushFirstBlockHash(bytes32[] storage blockHashes) internal {
		blockHashes.push(bytes32(0));
	}

	function getPrevHash(
		bytes32[] memory blockHashes
	) internal pure returns (bytes32) {
		return blockHashes[blockHashes.length - 1];
	}

	function pushBlockHash(
		bytes32[] storage blockHashes,
		bytes32 depositTreeRoot,
		bytes32 signatureHash
	) internal {
		blockHashes.push(
			_calcBlockHash(
				getPrevHash(blockHashes),
				depositTreeRoot,
				signatureHash,
				blockHashes.length
			)
		);
	}

	function _calcBlockHash(
		bytes32 prevBlockHash,
		bytes32 depositTreeRoot,
		bytes32 signatureHash,
		uint256 blockNumber
	) private pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					prevBlockHash,
					depositTreeRoot,
					signatureHash,
					blockNumber
				)
			);
	}
}
