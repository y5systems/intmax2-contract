// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.24;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {DepositLib} from "./DepositLib.sol";

/**
 * This contract will be used as a helper for all the sparse merkle tree related functions
 * https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/lib/DepositContract.sol
 */
contract DepositContract is ReentrancyGuardUpgradeable {
	/**
	 * @dev Thrown when the merkle tree is full
	 */
	error MerkleTreeFull();

	// Merkle tree levels
	uint256 internal constant _DEPOSIT_CONTRACT_TREE_DEPTH = 32;

	// This ensures `depositCount` will fit into 32-bits
	uint256 internal constant _MAX_DEPOSIT_COUNT =
		2 ** _DEPOSIT_CONTRACT_TREE_DEPTH - 1;

	// Branch array which contains the necessary sibilings to compute the next root when a new
	// leaf is inserted
	bytes32[_DEPOSIT_CONTRACT_TREE_DEPTH] internal _branch;

	// Counter of current deposits
	uint256 public depositCount;

	bytes32 internal defaultHash;

	function __DepositContract_init() internal {
		defaultHash = DepositLib.getHash(DepositLib.Deposit(0, 0, 0));
	}

	function getDepositRoot() public view returns (bytes32) {
		return _getDepositRoot();
	}

	/**
	 * @notice Computes and returns the merkle root
	 */
	function _getDepositRoot() internal view returns (bytes32) {
		bytes32 node = defaultHash;
		uint256 size = depositCount;
		bytes32 currentZeroHashHeight = defaultHash;

		for (
			uint256 height = 0;
			height < _DEPOSIT_CONTRACT_TREE_DEPTH;
			height++
		) {
			if (((size >> height) & 1) == 1)
				node = keccak256(abi.encodePacked(_branch[height], node));
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
	function _deposit(bytes32 leafHash) internal {
		bytes32 node = leafHash;

		// Avoid overflowing the Merkle tree (and prevent edge case in computing `_branch`)
		if (depositCount >= _MAX_DEPOSIT_COUNT) {
			revert MerkleTreeFull();
		}

		// Add deposit data root to Merkle tree (update a single `_branch` node)
		uint256 size = ++depositCount;
		for (
			uint256 height = 0;
			height < _DEPOSIT_CONTRACT_TREE_DEPTH;
			height++
		) {
			if (((size >> height) & 1) == 1) {
				_branch[height] = node;
				return;
			}
			node = keccak256(abi.encodePacked(_branch[height], node));
		}
		// As the loop should always end prematurely with the `return` statement,
		// this code should be unreachable. We assert `false` just to be safe.
		assert(false);
	}
}
