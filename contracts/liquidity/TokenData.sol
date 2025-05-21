// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ITokenData} from "./Interfaces/ITokenData.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title Token Data Contract
 * @notice Abstract contract for managing token information and indices in the Intmax2 protocol
 * @dev Implements the ITokenData interface and provides storage and functionality for tracking
 * different token types (Native, ERC20, ERC721, ERC1155)
 */
abstract contract TokenData is Initializable, ITokenData {
	/**
	 * @notice Native currency (ETH) address constant
	 * @dev Used as a key in mappings to represent the native token
	 */
	address private constant NATIVE_CURRENCY_ADDRESS = address(0);

	/**
	 * @notice Maximum number of chains supported for token index partitioning
	 * @dev Used to calculate token index partitions across different chains
	 */
	uint16 private constant MAX_SUPPORTED_CHAINS = 10;

	/**
	 * @notice Maximum token index value (2^32 - 1)
	 * @dev Used in token index partition calculations
	 */
	uint32 private constant MAX_TOKEN_INDEX = type(uint32).max;

	/**
	 * @notice Chain ID of the current blockchain
	 * @dev Stored during initialization and used for token index creation
	 */
	uint16 private chainId;

	/**
	 * @notice Array of all token information stored in the system
	 * @dev Index in this array corresponds to the token index used throughout the protocol
	 */
	TokenInfo[] private tokenInfoList;

	/**
	 * @notice Mapping from token address to token index for fungible tokens (NATIVE and ERC20)
	 * @dev For fungible tokens, the tokenId is not relevant for indexing
	 */
	mapping(address => uint32) private fungibleTokenIndexMap;

	/**
	 * @notice Mapping from token address and token ID to token index for non-fungible tokens (ERC721 and ERC1155)
	 * @dev For non-fungible tokens, both address and ID are needed for indexing
	 */
	mapping(address => mapping(uint256 => uint32))
		private nonFungibleTokenIndexMap;

	/**
	 * @notice Initializes the TokenData contract with native token and initial ERC20 tokens
	 * @dev Called during contract initialization to set up the token indices
	 * @param initialERC20Tokens Array of ERC20 token addresses to initialize with
	 */
	// solhint-disable-next-line func-name-mixedcase
	function __TokenData_init(
		address[] memory initialERC20Tokens
	) internal onlyInitializing {
		// Store the chain ID to use for token index partitioning
		chainId = uint16(block.chainid);
		
		_createTokenIndex(TokenType.NATIVE, NATIVE_CURRENCY_ADDRESS, 0);
		for (uint256 i = 0; i < initialERC20Tokens.length; i++) {
			_createTokenIndex(TokenType.ERC20, initialERC20Tokens[i], 0);
		}
	}

	/**
	 * @notice Gets the token index for a token, creating a new index if it doesn't exist
	 * @dev Used during deposit operations to ensure all tokens have an index
	 * @param tokenType The type of the token (NATIVE, ERC20, ERC721, ERC1155)
	 * @param tokenAddress The address of the token contract (zero address for native tokens)
	 * @param tokenId The ID of the token (used for ERC721 and ERC1155)
	 * @return uint32 The index of the token (either existing or newly created)
	 */
	function _getOrCreateTokenIndex(
		TokenType tokenType,
		address tokenAddress,
		uint256 tokenId
	) internal returns (uint32) {
		(bool ok, uint32 tokenIndex) = getTokenIndex(
			tokenType,
			tokenAddress,
			tokenId
		);
		if (ok) {
			return tokenIndex;
		}

		return _createTokenIndex(tokenType, tokenAddress, tokenId);
	}

	/**
	 * @notice Retrieves the index of the native token (ETH)
	 * @dev The native token is the first token in each chain's partition
	 * @return uint32 The index of the native token for this chain
	 */
	function getNativeTokenIndex() public view returns (uint32) {
		// Use the fungibleTokenIndexMap to get the native token index for this chain
		return fungibleTokenIndexMap[NATIVE_CURRENCY_ADDRESS];
	}

	/**
	 * @notice Creates a new token index for a token
	 * @dev Adds the token to the tokenInfoList and updates the appropriate mapping
	 * @param tokenType The type of the token (NATIVE, ERC20, ERC721, ERC1155)
	 * @param tokenAddress The address of the token contract (zero address for native tokens)
	 * @param tokenId The ID of the token (used for ERC721 and ERC1155)
	 * @return uint32 The newly created token index
	 */
	function _createTokenIndex(
		TokenType tokenType,
		address tokenAddress,
		uint256 tokenId
	) private returns (uint32) {
		// Get the starting index for this chain's partition
		(uint32 startIndex, uint32 endIndex) = _calculateChainPartition(chainId);
		
		// Calculate the local token index within the chain's partition
		uint32 localIndex = uint32(tokenInfoList.length);
		
		// Calculate the global token index based on the chain partition
		uint32 tokenIndex = startIndex + localIndex;
		
		// Check if we've exceeded this chain's partition
		if (tokenIndex > endIndex) {
			revert("Token index exceeds chain's allocation");
		}
		
		tokenInfoList.push(TokenInfo(tokenType, tokenAddress, tokenId));
		
		if (tokenType == TokenType.NATIVE) {
			fungibleTokenIndexMap[NATIVE_CURRENCY_ADDRESS] = tokenIndex;
			return tokenIndex;
		}
		if (tokenAddress == address(0)) {
			revert TokenAddressIsZero();
		}
		if (tokenType == TokenType.ERC20) {
			fungibleTokenIndexMap[tokenAddress] = tokenIndex;
			return tokenIndex;
		}
		// ERC721 or ERC1155
		nonFungibleTokenIndexMap[tokenAddress][tokenId] = tokenIndex;
		return tokenIndex;
	}

	/**
	 * @notice Retrieves the token index for given token parameters
	 * @dev Checks the appropriate mapping based on token type
	 * @param tokenType The type of the token (NATIVE, ERC20, ERC721, ERC1155)
	 * @param tokenAddress The address of the token contract (zero address for native tokens)
	 * @param tokenId The ID of the token (used for ERC721 and ERC1155)
	 * @return bool Indicating whether the token index was found (true) or not (false)
	 * @return uint32 The index of the token if found, 0 if not found
	 */
	function getTokenIndex(
		TokenType tokenType,
		address tokenAddress,
		uint256 tokenId
	) public view returns (bool, uint32) {
		if (tokenType == TokenType.NATIVE) {
			// Get the stored native token index for this chain
			uint32 nativeIndex = fungibleTokenIndexMap[NATIVE_CURRENCY_ADDRESS];
			return (true, nativeIndex);
		}
		if (tokenAddress == address(0)) {
			revert TokenAddressIsZero();
		}
		if (tokenType == TokenType.ERC20) {
			uint32 tokenIndex = fungibleTokenIndexMap[tokenAddress];
			if (tokenIndex != 0) {
				return (true, tokenIndex);
			}
		}
		if (tokenType == TokenType.ERC721 || tokenType == TokenType.ERC1155) {
			uint32 tokenIndex = nonFungibleTokenIndexMap[tokenAddress][tokenId];
			if (tokenIndex != 0) {
				return (true, tokenIndex);
			}
		}
		return (false, 0);
	}

	/**
	 * @notice Retrieves token information for a given token index
	 * @dev Returns the TokenInfo struct from the tokenInfoList array
	 * @param tokenIndex The index of the token to retrieve information for
	 * @return TokenInfo struct containing the token's type, address, and ID
	 */
	function getTokenInfo(
		uint32 tokenIndex
	) public view returns (TokenInfo memory) {
		return tokenInfoList[tokenIndex];
	}

	/**
	 * @notice Calculates the partition range for a given chain ID
	 * @dev Returns the start and end indices for the specified chain's token index range
	 * @param _chainId The chain ID to calculate the partition for
	 * @return start The starting index for the chain's partition (inclusive)
	 * @return end The ending index for the chain's partition (inclusive)
	 */
	function _calculateChainPartition(uint16 _chainId) private pure returns (uint32 start, uint32 end) {
		if (_chainId > MAX_SUPPORTED_CHAINS || _chainId == 0) {
			revert ChainIdOutOfRange();
		}
		
		// Calculate partition size (divide the uint32 space by the max number of chains)
		uint32 partitionSize = MAX_TOKEN_INDEX / MAX_SUPPORTED_CHAINS;
		
		// Calculate start index (0-based chain ID index * partition size)
		start = partitionSize * (_chainId - 1);
		
		// Calculate end index (next partition start - 1)
		if (_chainId == MAX_SUPPORTED_CHAINS) {
			// For the last chain, use the maximum possible index
			end = MAX_TOKEN_INDEX;
		} else {
			end = partitionSize * _chainId - 1;
		}
		
		return (start, end);
	}
}
