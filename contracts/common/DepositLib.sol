// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library DepositLib {
	struct Deposit {
		bytes32 recipientSaltHash;
		uint32 tokenIndex;
		uint256 amount;
	}

	function getHash(Deposit memory deposit) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					deposit.recipientSaltHash,
					deposit.tokenIndex,
					deposit.amount
				)
			);
	}
}
