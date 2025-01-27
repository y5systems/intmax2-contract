// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface IBlockBuilderRegistry {
	/// @notice Event emitted when a block builder is online
	/// @param blockBuilder The address of the updated block builder
	/// @param url The URL of the block builder
	event BlockBuilderHeartbeat(address indexed blockBuilder, string url);

	function emitHeartbeat(string calldata url) external;
}
