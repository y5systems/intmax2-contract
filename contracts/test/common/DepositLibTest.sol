// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {DepositLib} from "../../common/DepositLib.sol";

contract DepositLibTest {
	using DepositLib for DepositLib.Deposit;

	function getHash(
		uint256 depositId,
		bytes32 recipientSaltHash,
		uint32 tokenIndex,
		uint256 amount
	) external pure returns (bytes32) {
		DepositLib.Deposit memory deposit = DepositLib.Deposit({
			depositId: depositId,
			recipientSaltHash: recipientSaltHash,
			tokenIndex: tokenIndex,
			amount: amount
		});
		return deposit.getHash();
	}

	function createDeposit(
		uint256 depositId,
		bytes32 recipientSaltHash,
		uint32 tokenIndex,
		uint256 amount
	) external pure returns (DepositLib.Deposit memory) {
		return
			DepositLib.Deposit({
				depositId: depositId,
				recipientSaltHash: recipientSaltHash,
				tokenIndex: tokenIndex,
				amount: amount
			});
	}
}
