// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ILiquidity} from "./ILiquidity.sol";

library DepositLib {
	function getHash(
		ILiquidity.Deposit memory deposit
	) internal pure returns (bytes32) {
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
