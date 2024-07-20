// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;
import {IL1ScrollMessenger} from "@scroll-tech/contracts/L1/IL1ScrollMessenger.sol";

contract L1ScrollMessenger is IL1ScrollMessenger {
	address public xDomainMessageSender;
	address public l2ScrollMessenger;

	function sendMessage(
		address _to,
		uint256 _value,
		bytes memory _message,
		uint256 _gasLimit
	) external payable {
		_sendMessage(_to, _value, _message, _gasLimit, msg.sender);
	}

	/// @inheritdoc IL1ScrollMessenger
	function relayMessageWithProof(
		address _from,
		address _to,
		uint256 _value,
		uint256 _nonce,
		bytes memory _message,
		L2MessageProof memory _proof
	) external {
		xDomainMessageSender = _from;
		(bool success, ) = _to.call{value: _value}(_message);
		xDomainMessageSender = address(0);
	}

	/// @inheritdoc IL1ScrollMessenger
	function replayMessage(
		address _from,
		address _to,
		uint256 _value,
		uint256 _messageNonce,
		bytes memory _message,
		uint32 _newGasLimit,
		address _refundAddress
	) external payable {
		_sendMessage(_to, _value, _message, _newGasLimit, msg.sender);
	}

	/**********************
	 * Internal Functions *
	 **********************/

	function _sendMessage(
		address _to,
		uint256 _value,
		bytes memory _message,
		uint256 _gasLimit,
		address _refundAddress
	) internal {
		// todo
	}

	function sendMessage(
		address target,
		uint256 value,
		bytes calldata message,
		uint256 gasLimit,
		address refundAddress
	) external payable override {}

	function dropMessage(
		address from,
		address to,
		uint256 value,
		uint256 messageNonce,
		bytes memory message
	) external override {}
}
