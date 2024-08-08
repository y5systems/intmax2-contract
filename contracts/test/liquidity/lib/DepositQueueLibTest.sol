// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {DepositQueueLib} from "../../../liquidity/lib/DepositQueueLib.sol";

contract DepositQueueLibTest {
	using DepositQueueLib for DepositQueueLib.DepositQueue;

	DepositQueueLib.DepositQueue private depositQueue;
	uint256 public latestDepositId;
	bytes32[] public latestDepositHashes;

	constructor() {
		depositQueue.initialize();
	}

	function enqueue(
		bytes32 depositHash,
		address sender
	) external returns (uint256) {
		latestDepositId = depositQueue.enqueue(depositHash, sender);
		return latestDepositId;
	}

	function deleteDeposit(
		uint256 depositId
	) external returns (DepositQueueLib.DepositData memory) {
		return depositQueue.deleteDeposit(depositId);
	}

	function analyze(
		uint256 upToDepositId,
		uint256[] memory rejectIndices
	) external {
		depositQueue.analyze(upToDepositId, rejectIndices);
	}

	// function collectAcceptedDeposits(
	// 	uint256 upToDepositId
	// ) external returns (bytes32[] memory) {
	// 	latestDepositHashes = depositQueue.collectAcceptedDeposits(
	// 		upToDepositId
	// 	);
	// 	return latestDepositHashes;
	// }

	function size() external view returns (uint256) {
		return DepositQueueLib.size(depositQueue);
	}

	// Helper functions to access internal state for testing
	function getFront() external view returns (uint256) {
		return depositQueue.front;
	}

	function getRear() external view returns (uint256) {
		return depositQueue.rear;
	}

	function getDepositData(
		uint256 depositId
	) external view returns (DepositQueueLib.DepositData memory) {
		return depositQueue.depositData[depositId];
	}
}
