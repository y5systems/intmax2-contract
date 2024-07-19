// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IBlockBuilderRegistry} from "../../block-builder-registry/IBlockBuilderRegistry.sol";

contract UnstakeReentrancyTest {
	IBlockBuilderRegistry private immutable REGISTRY;
	string private constant DUMMY_URL = "https://foobaa";

	constructor(address _blockBuilderRegistry) {
		REGISTRY = IBlockBuilderRegistry(_blockBuilderRegistry);
	}

	function updateBlockBuilder() external payable {
		REGISTRY.updateBlockBuilder{value: msg.value}(DUMMY_URL);
	}

	function stopBlockBuilder() external {
		REGISTRY.stopBlockBuilder();
	}

	function unstake() external {
		REGISTRY.unstake();
	}

	receive() external payable {
		REGISTRY.unstake();
	}
}
