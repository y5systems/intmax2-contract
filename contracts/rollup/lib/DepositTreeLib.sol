// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.24;

import {DepositLib} from "../../common/DepositLib.sol";

/**
 * This contract will be used as a helper for all the sparse merkle tree related functions
 * https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/lib/DepositContract.sol
 */
library DepositTreeLib {
	error MerkleTreeFull();

	// Merkle tree levels
	uint256 internal constant _DEPOSIT_CONTRACT_TREE_DEPTH = 32;

	struct DepositTree {
		bytes32[_DEPOSIT_CONTRACT_TREE_DEPTH] _branch;
		uint256 depositCount;
		bytes32 defaultHash;
	}

	// This ensures `depositCount` will fit into 32-bits
	uint256 internal constant _MAX_DEPOSIT_COUNT =
		2 ** _DEPOSIT_CONTRACT_TREE_DEPTH - 1;

	function initialize(DepositTree storage depositTree) internal {
		depositTree.depositCount = 0;
		depositTree.defaultHash = DepositLib.getHash(
			DepositLib.Deposit(0, 0, 0)
		);
		for (uint256 i = 0; i < _DEPOSIT_CONTRACT_TREE_DEPTH; i++) {
			depositTree._branch[i] = 0;
		}
	}

	/**
	 * @notice Computes and returns the merkle root
	 */
	function getRoot(
		DepositTree memory depositTree
	) internal pure returns (bytes32) {
		bytes32 node = depositTree.defaultHash;
		uint256 size = depositTree.depositCount;
		bytes32 currentZeroHashHeight = depositTree.defaultHash;

		for (
			uint256 height = 0;
			height < _DEPOSIT_CONTRACT_TREE_DEPTH;
			height++
		) {
			if (((size >> height) & 1) == 1)
				node = keccak256(
					abi.encodePacked(depositTree._branch[height], node)
				);
			else
				node = keccak256(abi.encodePacked(node, currentZeroHashHeight));

			currentZeroHashHeight = keccak256(
				abi.encodePacked(currentZeroHashHeight, currentZeroHashHeight)
			);
		}
		return node;
	}

	/**
	 * @notice Add a new leaf to the merkle tree
	 * @param leafHash Leaf hash
	 */
	function deposit(
		DepositTree storage depositTree,
		bytes32 leafHash
	) internal {
		bytes32 node = leafHash;

		// Avoid overflowing the Merkle tree (and prevent edge case in computing `_branch`)
		if (depositTree.depositCount >= _MAX_DEPOSIT_COUNT) {
			revert MerkleTreeFull();
		}

		uint256 size = ++depositTree.depositCount;
		for (
			uint256 height = 0;
			height < _DEPOSIT_CONTRACT_TREE_DEPTH;
			height++
		) {
			if (((size >> height) & 1) == 1) {
				depositTree._branch[height] = node;
				return;
			}
			node = keccak256(
				abi.encodePacked(depositTree._branch[height], node)
			);
		}
		// As the loop should always end prematurely with the `return` statement,
		// this code should be unreachable. We assert `false` just to be safe.
		assert(false);
	}

	function getBranch(
		DepositTree storage depositTree
	) internal view returns (bytes32[_DEPOSIT_CONTRACT_TREE_DEPTH] memory) {
		return depositTree._branch;
	}
}
