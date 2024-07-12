// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IRollup} from "../IRollup.sol";

library WithdrawalLib {
	function getHash(
		IRollup.Withdrawal memory withdrawal
	) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					withdrawal.recipient,
					withdrawal.tokenIndex,
					withdrawal.amount,
					withdrawal.salt
				)
			);
	}

	function isEmpty(
		IRollup.Withdrawal memory withdrawal
	) internal pure returns (bool) {
		return withdrawal.recipient == address(0);
	}
}
