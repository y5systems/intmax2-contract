// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library BlockLib {
	struct Block {
		bytes32 hash;
		address builder;
	}

	function pushGenesisBlock(
		Block[] storage blocks,
		bytes32 initialDepositTreeRoot
	) internal {
		blocks.push(
			Block({
				hash: _calcBlockHash(0, initialDepositTreeRoot, 0, 0),
				builder: address(0)
			})
		);
	}

	function getPrevHash(
		Block[] memory blocks
	) internal pure returns (bytes32) {
		return blocks[blocks.length - 1].hash;
	}

	function pushBlockInfo(
		Block[] storage blocks,
		bytes32 depositTreeRoot,
		bytes32 signatureHash,
		address _builder
	) internal returns (bytes32 blockHash) {
		blockHash = _calcBlockHash(
			getPrevHash(blocks),
			depositTreeRoot,
			signatureHash,
			uint32(blocks.length)
		);
		blocks.push(Block({hash: blockHash, builder: _builder}));

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
