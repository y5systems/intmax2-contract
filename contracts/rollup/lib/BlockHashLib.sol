// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library BlockHashLib {
	error NoBlocksYet();

	function pushGenesisBlockHash(
		bytes32[] storage blockHashes,
		bytes32 initialDepositTreeRoot
	) internal {
		blockHashes.push(
			_calcBlockHash(bytes32(0), initialDepositTreeRoot, bytes32(0), 0)
		);
	}

	function getBlockNumber(
		bytes32[] memory blockHashes
	) internal pure returns (uint32) {
		if (blockHashes.length == 0) {
			revert NoBlocksYet();
		}
		return uint32(blockHashes.length - 1);
	}

	function getPrevHash(
		bytes32[] memory blockHashes
	) internal pure returns (bytes32) {
		if (blockHashes.length <= 0) {
			revert NoBlocksYet();
		}
		return blockHashes[blockHashes.length - 1];
	}

	function pushBlockHash(
		bytes32[] storage blockHashes,
		bytes32 depositTreeRoot,
		bytes32 signatureHash
	) internal returns (bytes32 blockHash) {
		uint32 blockNumber = getBlockNumber(blockHashes) + 1;
		bytes32 prevHash = getPrevHash(blockHashes);
		blockHash = _calcBlockHash(
			prevHash,
			depositTreeRoot,
			signatureHash,
			blockNumber
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
