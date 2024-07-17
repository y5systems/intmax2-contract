// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library ChainedWithdrawalLib {
	struct ChainedWithdrawal {
		bytes32 prevWithdrawalHash;
		address recipient;
		uint32 tokenIndex;
		uint256 amount;
		bytes32 nullifier;
		bytes32 blockHash;
	}

	function getHash(
		ChainedWithdrawal memory withdrawal
	) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					withdrawal.prevWithdrawalHash,
					withdrawal.recipient,
					withdrawal.tokenIndex,
					withdrawal.amount,
					withdrawal.nullifier,
					withdrawal.blockHash
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
			if (withdrawal.prevWithdrawalHash != prevWithdrawalHash) {
				return false;
			}
			prevWithdrawalHash = getHash(withdrawal);
		}
		if (prevWithdrawalHash != lastWithdrawalHash) {
			return false;
		}
		return true;
	}
}
