// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IScrollMessenger} from "./IScrollMessenger.sol";
import {IL1Contract} from "./L1Contract.sol";

interface IL2Contract {
    function setGreeting(string memory greeting) external;
}

contract L2Contract {
    IScrollMessenger public _scrollMessenger;
    address public _liquidityContract;
    string public _greeting;

    event Greeted(string greeting);

    modifier OnlyL1Contract() {
        require(
            msg.sender == address(_scrollMessenger),
            "This method can only be called from Scroll Messenger."
        );
        require(
            _liquidityContract ==
                IScrollMessenger(_scrollMessenger).xDomainMessageSender()
        );
        _;
    }

    constructor(address scrollMessenger, address liquidityContract) {
        _scrollMessenger = IScrollMessenger(scrollMessenger);
        _liquidityContract = liquidityContract;
    }

    function sendMessageToL1(string memory greeting) public payable {
        uint256 gasLimit = 100000;
        bytes memory message = abi.encodeWithSelector(
            IL1Contract.setGreeting.selector,
            greeting
        );

        _scrollMessenger.sendMessage{value: msg.value}(
            _liquidityContract,
            0,
            message,
            gasLimit,
            msg.sender
        );
    }

    function setGreeting(string memory greeting) public OnlyL1Contract {
        _greeting = greeting;
        emit Greeted(greeting);
    }
}
