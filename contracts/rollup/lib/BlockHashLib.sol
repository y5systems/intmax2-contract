// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library BlockHashLib {
	function pushGenesisBlockHash(
		bytes32[] storage blockHashes,
		bytes32 initialDepositTreeRoot
	) internal {
		blockHashes.push(_calcBlockHash(0, initialDepositTreeRoot, 0, 0));
	}

	function getBlockNumber(
		bytes32[] memory blockHashes
	) internal pure returns (uint32) {
		return uint32(blockHashes.length);
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
	) internal returns (bytes32 blockHash) {
		blockHash = _calcBlockHash(
			getPrevHash(blockHashes),
			depositTreeRoot,
			signatureHash,
			getBlockNumber(blockHashes)
		);
		blockHashes.push(blockHash);
		return blockHash;
	}

	function _calcBlockHash(
		bytes32 prevBlockHash,
		bytes32 depositTreeRoot,
		bytes32 signatureHash,
		uint32 blockNumber
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
