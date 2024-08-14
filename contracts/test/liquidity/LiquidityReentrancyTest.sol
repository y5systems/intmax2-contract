// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ILiquidity} from "../../liquidity/ILiquidity.sol";
import {DepositLib} from "../../common/DepositLib.sol";

contract LiquidityReentrancyTest {
	ILiquidity private immutable LIQUIDITY;
	uint256 public depositId;
	bytes32 public recipientSaltHash;
	uint32 public tokenIndex;
	uint256 public amount;

	constructor(address _liquidity) {
		LIQUIDITY = ILiquidity(_liquidity);
	}

	function depositNativeToken(bytes32 _recipientSaltHash) external payable {
		LIQUIDITY.depositNativeToken{value: msg.value}(_recipientSaltHash);
	}

	function setTestArgs(
		uint256 _depositId,
		bytes32 _recipientSaltHash,
		uint32 _tokenIndex,
		uint256 _amount
	) external {
		depositId = _depositId;
		recipientSaltHash = _recipientSaltHash;
		tokenIndex = _tokenIndex;
		amount = _amount;
	}

	function cancelDeposit() external {
		DepositLib.Deposit memory deposit = DepositLib.Deposit({
			recipientSaltHash: recipientSaltHash,
			tokenIndex: tokenIndex,
			amount: amount
		});

		LIQUIDITY.cancelDeposit(depositId, deposit);
	}

	// solhint-disable-next-line no-complex-fallback
	receive() external payable {
		DepositLib.Deposit memory deposit = DepositLib.Deposit({
			recipientSaltHash: recipientSaltHash,
			tokenIndex: tokenIndex,
			amount: amount
		});
		LIQUIDITY.cancelDeposit(depositId, deposit);
	}
}
