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
	 * @notice Maximum number of chains supported
	 * @dev Used to calculate token index partitions across different chains
	 */
	uint32 private constant MAX_SUPPORTED_CHAINS = 2 ** 18;

	/**
	 * @notice Maximum number of tokens supported
	 * @dev Used to calculate token index partitions across different chains
	 */
	uint16 private constant MAX_SUPPORTED_TOKENS = 2 ** 14;

	/**
	 * @notice Mapping of all token information stored in the system
	 * @dev Index in this array corresponds to the token index used throughout the protocol
	 */
	mapping(uint32 => TokenInfo) private tokenInfoList;

	/**
	 * @notice Counter for the number of registered tokens
	 * @dev Used to keep track of the number of entries in the tokenInfoList mapping
	 */
	uint16 private tokenInfoCount = 0;

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
	 * @notice Chain ID of the current blockchain
	 * @dev Stored during initialization and used for token index creation
	 */
	 uint32 private chainId;

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
		if (block.chainid > MAX_SUPPORTED_CHAINS) {
			revert ChainIdOutOfRange();
		}
		chainId = uint32(block.chainid);

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
		uint32 tokenIndex = chainId;
		tokenIndex = (tokenIndex << 14) | (tokenInfoCount & 0x3FFF);

		tokenInfoCount++;
		if (tokenInfoCount >= MAX_SUPPORTED_TOKENS) {
			revert TokenLimitReached();
		}

		tokenInfoList[tokenIndex] = (TokenInfo(tokenType, tokenAddress, tokenId));

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
}
