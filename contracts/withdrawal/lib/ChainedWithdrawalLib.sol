// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library ChainedWithdrawalLib {
	struct ChainedWithdrawal {
		address recipient;
		uint32 tokenIndex;
		uint256 amount;
		bytes32 nullifier;
		bytes32 blockHash;
		uint32 blockNumber;
	}

	function hashWithPrevHash(
		ChainedWithdrawal memory withdrawal,
		bytes32 prevWithdrawalHash
	) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					prevWithdrawalHash,
					withdrawal.recipient,
					withdrawal.tokenIndex,
					withdrawal.amount,
					withdrawal.nullifier,
					withdrawal.blockHash,
					withdrawal.blockNumber
				)
			);
	}

	function verifyWithdrawalChain(
		ChainedWithdrawal[] memory withdrawals,
		bytes32 lastWithdrawalHash
	) internal pure returns (bool) {
		bytes32 prevWithdrawalHash = 0;
		for (uint256 i = 0; i < withdrawals.length; i++) {
			ChainedWithdrawal memory withdrawal = withdrawals[i];
			prevWithdrawalHash = hashWithPrevHash(
				withdrawal,
				prevWithdrawalHash
			);
		}
		if (prevWithdrawalHash != lastWithdrawalHash) {
			return false;
		}
		return true;
	}
}
