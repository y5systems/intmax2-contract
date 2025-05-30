// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {DepositLib} from "../../common/DepositLib.sol";
import {WithdrawalLib} from "../../common/WithdrawalLib.sol";
import {DepositQueueLib} from "../lib/DepositQueueLib.sol";
import {MessagingReceipt} from "./ILzRelay.sol";

/**
 * @title LzLiquidity Interface
 * @notice Interface for the LayerZero-specific Liquidity contract that manages deposits and withdrawals
 * @dev Handles cross-chain deposits and withdrawals using LayerZero protocol
 */
interface ILzLiquidity {
    /**
     * @notice address is zero address
     */
    error AddressZero();

    /**
     * @notice Error thrown when someone other than the original depositor tries to cancel a deposit
     */
    error OnlySenderCanCancelDeposit();

    /**
     * @notice Error thrown when the provided deposit hash doesn't match the calculated hash during cancellation
     * @param depositDataHash The hash from the deposit data
     * @param calculatedHash The hash calculated from given input
     */
    error InvalidDepositHash(bytes32 depositDataHash, bytes32 calculatedHash);

    /**
     * @notice Error thrown when the deposit ID has already been relayed to L2
     */
    error AlreadyRelayed();

    /**
     * @notice Error thrown when trying to deposit zero amount
     */
    error TriedToDepositZero();

    /**
     * @notice Error thrown when the deposit hash already exists
     * @param depositHash The hash that already exists
     */
    error DepositHashAlreadyExists(bytes32 depositHash);

    /**
     * @notice Error thrown when the deposit amount exceeds the limit
     * @param amount The amount that was attempted to be deposited
     * @param limit The maximum limit for the deposit
     */
    error DepositAmountExceedsLimit(uint256 amount, uint256 limit);

    /**
     * @notice Error thrown when a withdrawal with the given hash is not found
     * @param withdrawalHash The hash of the withdrawal that was not found
     */
    error WithdrawalNotFound(bytes32 withdrawalHash);

    /**
     * @notice Error thrown when the withdrawal fee ratio exceeds the limit
     */
    error WithdrawalFeeRatioExceedsLimit();

    /**
     * @notice Error thrown when the number of deposits to relay exceeds the limit
     */
    error RelayLimitExceeded();

    /**
     * @notice Error thrown when the AML validation fails
     */
    error AmlValidationFailed();

    /**
     * @notice Error thrown when the eligibility validation fails
     */
    error EligibilityValidationFailed();

    /**
     * @notice Error thrown when the sender is not the LzRelay
     */
    error SenderIsNotLzRelay();

    /**
     * @notice Error thrown when low level call to LzRelay fails
     */
    error CallToLzRelayFailed();

    /**
     * @notice Error thrown when an unsupported destination chain is specified
     * @param chainId The chain ID that was unsupported
     */
    error UnsupportedDestinationChain(uint32 chainId);

    /**
     * @notice Event emitted when a deposit is made
     * @param depositId The ID of the deposit
     * @param sender The address that made the deposit
     * @param recipientSaltHash The hash of the recipient's address and a secret salt
     * @param tokenIndex The index of the token that was deposited
     * @param amount The amount of tokens that was deposited
     * @param isEligible Whether the deposit is eligible
     * @param timestamp The timestamp when the deposit was made
     */
    event Deposited(
        uint256 indexed depositId,
        address indexed sender,
        bytes32 recipientSaltHash,
        uint32 tokenIndex,
        uint256 amount,
        bool isEligible,
        uint256 timestamp
    );

    /**
     * @notice Event emitted when deposits are relayed to L2
     * @param upToDepositId The upper limit of the deposit ID that was relayed
     * @param gasLimit The gas limit for the L2 transaction
     * @param message The message that was sent to L2
     */
    event DepositsRelayed(
        uint256 indexed upToDepositId,
        uint256 gasLimit,
        bytes message
    );

    /**
     * @notice Event emitted when a deposit is canceled
     * @param depositId The ID of the deposit that was canceled
     */
    event DepositCanceled(uint256 indexed depositId);

    /**
     * @notice Event emitted when a withdrawal is made claimable
     * @param withdrawalHash The hash of the withdrawal that is now claimable
     */
    event WithdrawalClaimable(bytes32 indexed withdrawalHash);

    /**
     * @notice Event emitted when a withdrawal is claimed
     * @param recipient The address that claimed the withdrawal
     * @param withdrawalHash The hash of the withdrawal that was claimed
     */
    event ClaimedWithdrawal(
        address indexed recipient,
        bytes32 indexed withdrawalHash
    );

    /**
     * @notice Event emitted when a direct withdrawal succeeds
     * @param withdrawalHash The hash of the withdrawal that succeeded
     * @param recipient The address that received the withdrawal
     */
    event DirectWithdrawalSuccessed(
        bytes32 indexed withdrawalHash,
        address indexed recipient
    );

    /**
     * @notice Event emitted when a direct withdrawal fails
     * @param withdrawalHash The hash of the withdrawal that failed
     * @param withdrawal The withdrawal data
     */
    event DirectWithdrawalFailed(
        bytes32 indexed withdrawalHash,
        WithdrawalLib.Withdrawal withdrawal
    );

    /**
     * @notice Event emitted when withdrawal fees are collected
     * @param tokenIndex The index of the token for which fees were collected
     * @param fee The amount of fees collected
     */
    event WithdrawalFeeCollected(uint32 indexed tokenIndex, uint256 fee);

    /**
     * @notice Event emitted when collected withdrawal fees are withdrawn
     * @param recipient The address that received the withdrawn fees
     * @param tokenIndex The index of the token for which fees were withdrawn
     * @param amount The amount of fees withdrawn
     */
    event WithdrawalFeeWithdrawn(
        address indexed recipient,
        uint32 indexed tokenIndex,
        uint256 amount
    );

    /**
     * @notice Event emitted when the permitter addresses are set
     * @param amlPermitter The address of the AML permitter contract
     * @param eligibilityPermitter The address of the eligibility permitter contract
     */
    event PermitterSet(
        address indexed amlPermitter,
        address indexed eligibilityPermitter
    );

    /**
     * @notice Event emitted when the withdrawal fee ratio is set
     * @param tokenIndex The index of the token
     * @param feeRatio The withdrawal fee ratio for the token (in basis points)
     */
    event WithdrawalFeeRatioSet(uint32 indexed tokenIndex, uint256 feeRatio);

    /**
     * @notice Pauses all deposit operations
     * @dev Only callable by the admin role
     */
    function pauseDeposits() external;

    /**
     * @notice Unpauses all deposit operations
     * @dev Only callable by the admin role
     */
    function unpauseDeposits() external;

    /**
     * @notice Sets the AML and eligibility permitter contract addresses
     * @dev Only callable by the admin role
     * @param _amlPermitter The address of the AML permitter contract
     * @param _eligibilityPermitter The address of the eligibility permitter contract
     */
    function setPermitter(
        address _amlPermitter,
        address _eligibilityPermitter
    ) external;

    /**
     * @notice Sets the withdrawal fee ratio for a specific token
     * @dev Only callable by the admin role. Fee ratio is in basis points (1bp = 0.01%)
     * @param tokenIndex The index of the token to set the fee ratio for
     * @param feeRatio The fee ratio to set (in basis points, max 1500 = 15%)
     */
    function setWithdrawalFeeRatio(uint32 tokenIndex, uint256 feeRatio) external;

    /**
     * @notice Withdraws collected fees for specified tokens to a recipient address
     * @dev Only callable by the admin role. Skips tokens with zero fees
     * @param recipient The address to receive the withdrawn fees
     * @param tokenIndices Array of token indices to withdraw fees for
     */
    function withdrawCollectedFees(
        address recipient,
        uint32[] calldata tokenIndices
    ) external;

    /**
     * @notice Deposit native currency (ETH) to Intmax
     * @dev recipientSaltHash is the Poseidon hash of the intmax2 address (32 bytes) and a secret salt
     * @param recipientSaltHash The hash of the recipient's address and a secret salt
     * @param amlPermission The data to verify AML check
     * @param eligibilityPermission The data to verify eligibility check
     */
    function depositNativeToken(
        bytes32 recipientSaltHash,
        bytes calldata amlPermission,
        bytes calldata eligibilityPermission
    ) external payable;

    /**
     * @notice Deposit a specified amount of ERC20 token to Intmax
     * @dev Requires prior approval for this contract to spend the tokens
     * @dev recipientSaltHash is the Poseidon hash of the intmax2 address (32 bytes) and a secret salt
     * @param tokenAddress The address of the ERC20 token contract
     * @param recipientSaltHash The hash of the recipient's address and a secret salt
     * @param amount The amount of tokens to deposit
     * @param amlPermission The data to verify AML check
     * @param eligibilityPermission The data to verify eligibility check
     */
    function depositERC20(
        address tokenAddress,
        bytes32 recipientSaltHash,
        uint256 amount,
        bytes calldata amlPermission,
        bytes calldata eligibilityPermission
    ) external;

    /**
     * @notice Deposit an ERC721 token to Intmax
     * @dev Requires prior approval for this contract to transfer the token
     * @param tokenAddress The address of the ERC721 token contract
     * @param recipientSaltHash The hash of the recipient's address and a secret salt
     * @param tokenId The ID of the token to deposit
     * @param amlPermission The data to verify AML check
     * @param eligibilityPermission The data to verify eligibility check
     */
    function depositERC721(
        address tokenAddress,
        bytes32 recipientSaltHash,
        uint256 tokenId,
        bytes calldata amlPermission,
        bytes calldata eligibilityPermission
    ) external;

    /**
     * @notice Deposit a specified amount of ERC1155 token to Intmax
     * @dev Requires prior approval for this contract to transfer the tokens
     * @param tokenAddress The address of the ERC1155 token contract
     * @param recipientSaltHash The hash of the recipient's address and a secret salt
     * @param tokenId The ID of the token to deposit
     * @param amount The amount of tokens to deposit
     * @param amlPermission The data to verify AML check
     * @param eligibilityPermission The data to verify eligibility check
     */
    function depositERC1155(
        address tokenAddress,
        bytes32 recipientSaltHash,
        uint256 tokenId,
        uint256 amount,
        bytes calldata amlPermission,
        bytes calldata eligibilityPermission
    ) external;

    /**
     * @notice Relays deposits to the Intmax rollup via LayerZero
     * @dev The msg.value is used to pay for the LayerZero message fees
     * @param upToDepositId The upper limit of the Deposit ID that will be relayed
     * @param options Additional options for LayerZero message execution
     * @return receipt A MessagingReceipt struct containing details of the message sent
     */
    function relayDeposits(
        uint256 upToDepositId,
        bytes calldata options
    ) external payable returns (MessagingReceipt memory receipt);

    /**
     * @notice Cancels a deposit that hasn't been relayed yet
     * @dev Only the original sender can cancel their deposit, and only if it hasn't been relayed
     * @param depositId The ID of the deposit to cancel
     * @param deposit The deposit data structure containing the original deposit details
     */
    function cancelDeposit(
        uint256 depositId,
        DepositLib.Deposit calldata deposit
    ) external;

    /**
     * @notice Claims withdrawals for the caller
     * @dev Checks if the withdrawals are claimable and sends the tokens to the recipients
     * @param withdrawals Array of withdrawals to claim
     */
    function claimWithdrawals(
        WithdrawalLib.Withdrawal[] calldata withdrawals
    ) external;

    /**
     * @notice Processes both direct withdrawals and claimable withdrawals from LayerZero
     * @dev Only callable through the LzRelay
     * @param withdrawals Array of direct withdrawals to process
     * @param withdrawalHashes Array of withdrawal hashes to mark as claimable
     */
    function processWithdrawals(
        WithdrawalLib.Withdrawal[] calldata withdrawals,
        bytes32[] calldata withdrawalHashes
    ) external;

    /**
     * @notice Sets the LayerZero Relayer contract address
     * @dev Only callable by the admin role
     * @param _lzRelay The new LayerZero Relayer contract address
     */
    function setLzRelayer(address _lzRelay) external;

    /**
     * @notice Validates that a token index belongs to the current chain ID
     * @param depositId The deposit ID to check
     * @param recipientSaltHash The hash of the recipient's address and salt
     * @param tokenIndex The token index to validate
     * @param amount The amount being deposited
     * @param isEligible Whether the deposit is eligible
     * @param sender The address of the sender
     * @return bool Whether the deposit is valid
     */
    function isDepositValid(
        uint256 depositId,
        bytes32 recipientSaltHash,
        uint32 tokenIndex,
        uint256 amount,
        bool isEligible,
        address sender
    ) external view returns (bool);

    /**
     * @notice Get the deposit data for a specific deposit ID
     * @param depositId The ID of the deposit to get data for
     * @return The deposit data for the specified ID
     */
    function getDepositData(
        uint256 depositId
    ) external view returns (DepositQueueLib.DepositData memory);

    /**
     * @notice Get the deposit data for multiple deposit IDs
     * @param depositIds Array of deposit IDs to get data for
     * @return Array of deposit data for the specified IDs
     */
    function getDepositDataBatch(
        uint256[] memory depositIds
    ) external view returns (DepositQueueLib.DepositData[] memory);

    /**
     * @notice Get the deposit hash for a specific deposit ID
     * @param depositId The ID of the deposit to get the hash for
     * @return The hash of the deposit
     */
    function getDepositDataHash(
        uint256 depositId
    ) external view returns (bytes32);

    /**
     * @notice Get the ID of the last relayed deposit
     * @return The ID of the last deposit that was relayed to L2
     */
    function getLastRelayedDepositId() external view returns (uint256);

    /**
     * @notice Get the ID of the last deposit
     * @return The ID of the last deposit that was made
     */
    function getLastDepositId() external view returns (uint256);

    /**
     * @notice ERC1155 token receiver function required for this contract to receive ERC1155 tokens
     * @dev Implements the IERC1155Receiver interface
     * @return bytes4 The function selector to indicate support for ERC1155 token receiving
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4);
}