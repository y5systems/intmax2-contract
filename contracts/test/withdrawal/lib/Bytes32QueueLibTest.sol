// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Bytes32QueueLib} from "../../../withdrawal/lib/Bytes32QueueLib.sol";

contract Bytes32QueueLibTest {
	using Bytes32QueueLib for Bytes32QueueLib.Queue;

	Bytes32QueueLib.Queue private queue;
	uint256 public latestIndex;
	bytes32 public latestValue;

	constructor() {
		queue.initialize();
	}

	function nextIndex() external view returns (uint256) {
		return queue.nextIndex();
	}

	function enqueue(bytes32 value) external returns (uint256) {
		latestIndex = queue.enqueue(value);
		return latestIndex;
	}

	function dequeue() external returns (bytes32) {
		latestValue = queue.dequeue();
		return latestValue;
	}

	function isEmpty() external view returns (bool) {
		return queue.isEmpty();
	}

	function size() external view returns (uint256) {
		return queue.size();
	}

	function peek() external view returns (bytes32) {
		return queue.peek();
	}

	// Additional helper functions for testing

	function getFront() external view returns (uint256) {
		return queue.front;
	}

	function getRear() external view returns (uint256) {
		return queue.rear;
	}

	function getDataAtIndex(uint256 index) external view returns (bytes32) {
		// solhint-disable-next-line gas-custom-errors
		require(index < queue.data.length, "Index out of bounds");
		return queue.data[index];
	}

	function getDataLength() external view returns (uint256) {
		return queue.data.length;
	}
}
