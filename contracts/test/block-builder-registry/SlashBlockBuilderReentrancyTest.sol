// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IBlockBuilderRegistry} from "../../block-builder-registry/IBlockBuilderRegistry.sol";

contract SlashBlockBuilderReentrancyTest {
	IBlockBuilderRegistry private immutable REGISTRY;

	constructor(address _blockBuilderRegistry) {
		REGISTRY = IBlockBuilderRegistry(_blockBuilderRegistry);
	}

	receive() external payable {
		// REGISTRY.slashBlockBuilder(address(1), address(2));
	}
}
