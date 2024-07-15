// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IRollup} from "../IRollup.sol";

library BlockHashesLib {
	function pushFirstBlockHash(bytes32[] storage blockHashes) internal {
		// The initial state of the deposit tree is a height-32 Keccak Merkle tree where all leaves are 0,
		// and initialDepositTreeRoot is the Merkle root of this tree.
		bytes32 initialDepositTreeRoot = 0;
		for (uint256 i = 0; i < 32; i++) {
			initialDepositTreeRoot = keccak256(abi.encodePacked(initialDepositTreeRoot, initialDepositTreeRoot));
		}

		blockHashes.push(_calcBlockHash(
			0,
			initialDepositTreeRoot,
			0,
			0
		));
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
			blockHashes.length
		);
		blockHashes.push(blockHash);

		return blockHash;
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
