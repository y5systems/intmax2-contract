// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface IBlockBuilderRegistry {
	/// @notice Error thrown when trying to register a block builder with an empty URL
	error URLIsEmpty();

	/// @notice Event emitted when a block builder is online
	/// @param blockBuilder The address of the updated block builder
	/// @param url The URL of the block builder
	event BlockBuilderHeartbeat(address indexed blockBuilder, string url);
}
