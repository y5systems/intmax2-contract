// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IScrollMessenger} from "./IScrollMessenger.sol";
import {IL2Contract} from "./L2Contract.sol";

interface IL1Contract {
	function setGreeting(string memory greeting) external;
}

contract L1Contract {
	IScrollMessenger public _scrollMessenger;
	address public _rollupContract;
	string public _greeting;

	event Greeted(string greeting);

	modifier OnlyL2Contract() {
		require(
			_rollupContract != address(0),
			"Ensure that the rollup contract has been set"
		);
		require(
			msg.sender == address(_scrollMessenger),
			"This method can only be called from Scroll Messenger."
		);
		require(
			_rollupContract ==
				IScrollMessenger(_scrollMessenger).xDomainMessageSender()
		);
		_;
	}

	constructor(address scrollMessenger) {
		_scrollMessenger = IScrollMessenger(scrollMessenger);
	}

	function updateRollupContract(address rollupContract) public {
		_rollupContract = rollupContract;
	}

	function sendMessageToL2(string memory greeting) public payable {
		require(
			_rollupContract != address(0),
			"Ensure that the rollup contract has been set"
		);
		uint256 gasLimit = 100000;
		bytes memory message = abi.encodeWithSelector(
			IL2Contract.setGreeting.selector,
			greeting
		);

		_scrollMessenger.sendMessage{value: msg.value}(
			_rollupContract,
			0,
			message,
			gasLimit,
			msg.sender
		);
	}

	function setGreeting(string memory greeting) public OnlyL2Contract {
		_greeting = greeting;
		emit Greeted(greeting);
	}
}
