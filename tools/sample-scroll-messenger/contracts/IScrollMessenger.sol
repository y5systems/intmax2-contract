// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IScrollMessenger {
	function sendMessage(
		address target,
		uint256 value,
		bytes calldata message,
		uint256 gasLimit,
		address refundAddress
	) external payable;

	function xDomainMessageSender() external view returns (address);
}
