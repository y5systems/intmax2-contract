// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library DepositQueueLib {
	error TriedCollectDepositsNotAnalyzedYet(
		uint256 upToDepositId,
		uint256 lastAnalyzedDepositId
	);

	error TriedAnalyzeNotExists(uint256 upToDepositId, uint256 lastDepositId);

	error TriedToRejectOutOfRange(
		uint256 rejectIndex,
		uint256 front,
		uint256 upToDepositId
	);

	/**
	 * @title depositQueue
	 * @dev Represents a queue of pending deposits.
	 */
	struct DepositQueue {
		DepositData[] depositData; ///< Array of deposits that are pending.
		uint256 front; ///< Index of the first element in the queue.
		uint256 rear; ///< Index of the next position after the last element in the queue.
	}

	struct DepositData {
		bytes32 depositHash;
		address sender;
		bool isRejected;
	}

	function initialize(DepositQueue storage depositQueue) internal {
		// push a dummy element to make the queue 1-indexed
		// this way, we can safely use 0 as the initial value for lastAnalyzedDepositId
		depositQueue.depositData.push(DepositData(0, address(0), false));
		depositQueue.front = 1;
		depositQueue.rear = 1;
	}

	function enqueue(
		DepositQueue storage depositQueue,
		bytes32 depositHash,
		address sender
	) internal returns (uint256 depositId) {
		depositQueue.depositData.push(DepositData(depositHash, sender, false));
		depositId = depositQueue.rear;
		depositQueue.rear++;
	}

	function deleteDeposit(
		DepositQueue storage depositQueue,
		uint256 depositId
	) internal returns (DepositData memory depositData) {
		depositData = depositQueue.depositData[depositId];
		delete depositQueue.depositData[depositId];
	}

	function analyze(
		DepositQueue storage depositQueue,
		uint256 upToDepositId,
		uint256[] memory rejectIndices
	) internal returns (bytes32[] memory) {
		// assert that upToDepositId < rear
		if (upToDepositId >= depositQueue.rear) {
			revert TriedAnalyzeNotExists(upToDepositId, depositQueue.rear);
		}
		for (uint256 i = 0; i < rejectIndices.length; i++) {
			uint256 rejectIndex = rejectIndices[i];
			// assert that front <= rejectIndex <= upToDepositId
			if (
				rejectIndex > upToDepositId || rejectIndex < depositQueue.front
			) {
				revert TriedToRejectOutOfRange(
					rejectIndex,
					depositQueue.front,
					upToDepositId
				);
			}
			depositQueue.depositData[rejectIndex].isRejected = true;
		}
		uint256 counter = 0;
		for (uint256 i = depositQueue.front; i <= upToDepositId; i++) {
			// deleted data are skipped
			if (depositQueue.depositData[i].sender == address(0)) {
				continue;
			}
			if (depositQueue.depositData[i].isRejected) {
				continue;
			}
			counter++;
		}
		bytes32[] memory depositHashes = new bytes32[](counter);
		uint256 depositHashesIndex = 0;
		for (uint256 i = depositQueue.front; i <= upToDepositId; i++) {
			// deleted data are skipped
			if (depositQueue.depositData[i].sender == address(0)) {
				continue;
			}
			if (depositQueue.depositData[i].isRejected) {
				continue;
			}
			depositHashes[depositHashesIndex] = depositQueue
				.depositData[i]
				.depositHash;
			depositHashesIndex++;
		}
		// because front <= upToDepositId < rear, we can safely update front
		depositQueue.front = upToDepositId + 1;
		return depositHashes;
	}

	function size(
		DepositQueue memory depositQueue
	) internal pure returns (uint256) {
		return depositQueue.rear - depositQueue.front;
	}
}
