// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract L2ScrollMessengerTestForWithdrawal {
	address public to;
	uint256 public value;
	bytes public message;
	uint256 public gasLimit;
	address public sender;
	uint256 public msgValue;

	function sendMessage(
		address _to,
		uint256 _value,
		bytes calldata _message,
		uint256 _gasLimit,
		address _sender
	) external payable {
		to = _to;
		value = _value;
		message = _message;
		gasLimit = _gasLimit;
		sender = _sender;
		msgValue = msg.value;
	}
}
