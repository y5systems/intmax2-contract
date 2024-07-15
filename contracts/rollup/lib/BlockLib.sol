// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IRollup} from "../IRollup.sol";

library BlockLib {
	function pushFirstBlockInfo(IRollup.Block[] storage blocks) internal {
		// The initial state of the deposit tree is a height-32 Keccak Merkle tree where all leaves are 0,
		// and initialDepositTreeRoot is the Merkle root of this tree.
		bytes32 initialDepositTreeRoot = 0;
		for (uint256 i = 0; i < 32; i++) {
			initialDepositTreeRoot = keccak256(
				abi.encodePacked(initialDepositTreeRoot, initialDepositTreeRoot)
			);
		}
		blocks.push(
			IRollup.Block({
				hash: _calcBlockHash(0, initialDepositTreeRoot, 0, 0),
				builder: address(0)
			})
		);
	}

	function getPrevHash(
		IRollup.Block[] memory blocks
	) internal pure returns (bytes32) {
		return blocks[blocks.length - 1].hash;
	}

	function pushBlockInfo(
		IRollup.Block[] storage blocks,
		bytes32 depositTreeRoot,
		bytes32 signatureHash,
		address _builder
	) internal returns (bytes32 blockHash) {
		blockHash = _calcBlockHash(
			getPrevHash(blocks),
			depositTreeRoot,
			signatureHash,
			blocks.length
		);
		blocks.push(IRollup.Block({hash: blockHash, builder: _builder}));

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
