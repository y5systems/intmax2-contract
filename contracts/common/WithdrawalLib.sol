// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library WithdrawalLib {
	struct Withdrawal {
		address recipient;
		uint32 tokenIndex;
		uint256 amount;
		bytes32 nullifier; // make sure that the withdrawal is unique
	}

	function getHash(
		Withdrawal memory withdrawal
	) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					withdrawal.recipient,
					withdrawal.tokenIndex,
					withdrawal.amount,
					withdrawal.nullifier
				)
			);
	}
}
