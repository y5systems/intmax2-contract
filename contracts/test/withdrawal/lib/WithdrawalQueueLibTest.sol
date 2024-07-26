// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {WithdrawalQueueLib} from "../../../withdrawal/lib/WithdrawalQueueLib.sol";
import {WithdrawalLib} from "../../../common/WithdrawalLib.sol";

contract WithdrawalQueueLibTest {
	using WithdrawalQueueLib for WithdrawalQueueLib.Queue;

	WithdrawalQueueLib.Queue private queue;
	uint256 public latestIndex;
	WithdrawalLib.Withdrawal public latestWithdrawal;

	constructor() {
		queue.initialize();
	}

	function nextIndex() external view returns (uint256) {
		return queue.nextIndex();
	}

	function enqueue(
		WithdrawalLib.Withdrawal memory value
	) external returns (uint256) {
		latestIndex = queue.enqueue(value);
		return latestIndex;
	}

	function dequeue() external returns (WithdrawalLib.Withdrawal memory) {
		latestWithdrawal = queue.dequeue();
		return latestWithdrawal;
	}

	function isEmpty() external view returns (bool) {
		return queue.isEmpty();
	}

	function size() external view returns (uint256) {
		return queue.size();
	}

	function peek() external view returns (WithdrawalLib.Withdrawal memory) {
		return queue.peek();
	}

	// Additional helper functions for testing

	function getFront() external view returns (uint256) {
		return queue.front;
	}

	function getRear() external view returns (uint256) {
		return queue.rear;
	}

	function getWithdrawalAtIndex(
		uint256 index
	) external view returns (WithdrawalLib.Withdrawal memory) {
		// solhint-disable-next-line gas-custom-errors
		require(index < queue.data.length, "Index out of bounds");
		return queue.data[index];
	}

	function getDataLength() external view returns (uint256) {
		return queue.data.length;
	}

	// Helper function to create a Withdrawal struct
	function createWithdrawal(
		address recipient,
		uint32 tokenIndex,
		uint256 amount,
		uint256 id
	) external pure returns (WithdrawalLib.Withdrawal memory) {
		return WithdrawalLib.Withdrawal(recipient, tokenIndex, amount, id);
	}
}
