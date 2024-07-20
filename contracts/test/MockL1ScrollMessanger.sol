// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;
import {IL1ScrollMessenger} from "@scroll-tech/contracts/L1/IL1ScrollMessenger.sol";
import {IMockCommunication} from "./IMockCommunication.sol";

contract L1ScrollMessenger is IL1ScrollMessenger, IMockCommunication {
	address public xDomainMessageSender;
	mapping(bytes32 => bool) public isL2MessageExecuted;
	uint256 nonce;
	mapping(bytes32 => bool) public receivedCalldataHash;
	address counterpart;

	function initialize(address counterpart_) external {
		counterpart = counterpart_;
	}

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
		(_proof);
		bytes32 _xDomainCalldataHash = keccak256(
			_encodeXDomainCalldata(_from, _to, _value, _nonce, _message)
		);
		require(
			receivedCalldataHash[_xDomainCalldataHash],
			"message not found"
		);
		require(
			!isL2MessageExecuted[_xDomainCalldataHash],
			"Message was already successfully executed"
		);
		xDomainMessageSender = _from;
		(bool success, ) = _to.call{value: _value}(_message);
		xDomainMessageSender = address(0);
		if (success) {
			isL2MessageExecuted[_xDomainCalldataHash] = true;
			emit RelayedMessage(_xDomainCalldataHash);
		} else {
			emit FailedRelayedMessage(_xDomainCalldataHash);
		}
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
		(_messageNonce);
		(_from);
		(_refundAddress);
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
		(_gasLimit);
		(_refundAddress);
		bytes32 _xDomainCalldataHash = keccak256(
			_encodeXDomainCalldata(msg.sender, _to, _value, nonce, _message)
		);
		sendCalldataHash(_xDomainCalldataHash);
		nonce++;
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

	function _encodeXDomainCalldata(
		address _sender,
		address _target,
		uint256 _value,
		uint256 _messageNonce,
		bytes memory _message
	) internal pure returns (bytes memory) {
		return
			abi.encodeWithSignature(
				"relayMessage(address,address,uint256,uint256,bytes)",
				_sender,
				_target,
				_value,
				_messageNonce,
				_message
			);
	}

	function receiveCalldataHash(bytes32 calldataHash) external {
		require(msg.sender == counterpart);
		receivedCalldataHash[calldataHash] = true;
	}

	function sendCalldataHash(bytes32 calldataHash) internal {
		IMockCommunication(counterpart).receiveCalldataHash(calldataHash);
	}
}
