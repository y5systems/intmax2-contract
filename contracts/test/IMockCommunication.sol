// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

interface IMockCommunication {
	function receiveCalldataHash(bytes32 calldataHash) external;
}
