// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

/**
 * @title LzLiquidity Contract
 * @notice This contract manages deposits and withdrawals of various token types using LayerZero protocol
 * @dev Handles deposit queuing, withdrawal processing, fee collection, and AML/eligibility checks
 */
import {ILzLiquidity} from "./Interfaces/ILzLiquidity.sol";
import {ILzRelay, MessagingReceipt} from "./Interfaces/ILzRelay.sol";
import {IContribution} from "../contribution/IContribution.sol";
import {IPermitter} from "../permitter/IPermitter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import {TokenData} from "./TokenData.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {DepositLib} from "../common/DepositLib.sol";
import {WithdrawalLib} from "../common/WithdrawalLib.sol";
import {DepositQueueLib} from "./lib/DepositQueueLib.sol";
import {ERC20CallOptionalLib} from "./lib/ERC20CallOptionalLib.sol";
import {DepositLimit} from "./lib/DepositLimit.sol";

contract LzLiquidity is
    TokenData,
    PausableUpgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ILzLiquidity
{
    using SafeERC20 for IERC20;
    using ERC20CallOptionalLib for IERC20;
    using DepositLib for DepositLib.Deposit;
    using WithdrawalLib for WithdrawalLib.Withdrawal;
    using DepositQueueLib for DepositQueueLib.DepositQueue;

    /// @notice Relayer role constant
    bytes32 public constant RELAYER = keccak256("RELAYER");

    /// @notice Withdrawal role constant
    bytes32 public constant WITHDRAWAL = keccak256("WITHDRAWAL");

    /// @notice Withdrawal fee ratio limit
    /// @dev 1bp = 0.01%
    uint256 public constant WITHDRAWAL_FEE_RATIO_LIMIT = 1500;

    /// @notice Maximum number of deposits that can be relayed in a single transaction
    /// @dev This limit prevents situations where too many deposits are relayed to L2 simultaneously,
    /// @dev which could exceed the L2 block gas limit and cause transaction failures.
    uint256 public constant RELAY_LIMIT = 450;

	/**
	 * @notice Chain index constants for Scroll networks.
	 * @dev Used to validate against token-index chainIndex.
	 * 
	 * SCROLL_CHAIN_INDEX - Chain Index for Scroll networks.
	 */
	uint8 private constant SCROLL_CHAIN_INDEX = 1;

    /// @notice Deployment time which is used to calculate the deposit limit
    uint256 public deploymentTime;

    /// @notice Address of the Contribution contract
    IContribution public contribution;

    /// @notice Address of the Rollup contract
    address public rollup;

    /// @notice Address of the LzRelay contract
    address public lzRelay;

    /// @notice Address of the AML Permitter contract
    /// @dev If not set, we skip AML check
    IPermitter public amlPermitter;

    /// @notice Address of the Circulation Permitter contract
    /// @dev If not set, we skip eligibility permission check
    IPermitter public eligibilityPermitter;

    /// @notice Mapping of withdrawal hashes to their timestamp when they became claimable
    /// @dev A value of 0 means the withdrawal is not claimable
    mapping(bytes32 => uint256) public claimableWithdrawals;

    /// @notice Withdrawal fee ratio for each token index
    /// @dev 1bp = 0.01%
    mapping(uint32 => uint256) public withdrawalFeeRatio;

    /// @notice Mapping of token index to the total amount of withdrawal fees collected
    /// @dev Used to track fees that can be withdrawn by the admin
    mapping(uint32 => uint256) public collectedWithdrawalFees;

    /// @notice Mapping of deposit hashes to a boolean indicating whether the deposit hash exists
    /// @dev Used to prevent duplicate deposits with the same parameters
    mapping(bytes32 => bool) public doesDepositHashExist;

    /// @notice Deposit information queue that tracks all deposits
    /// @dev Used to manage the order and state of deposits
    DepositQueueLib.DepositQueue private depositQueue;

    mapping(bytes32 => DepositLib.Deposit) private depositDetails;
    
    /**
     * @notice Modifier to restrict access to only the withdrawal role through the LzRelay
     * @dev Ensures the function is called via LzRelay and sender has WITHDRAWAL role
     */
    modifier onlyWithdrawalRole() {
        if (_msgSender() != lzRelay) {
            revert SenderIsNotLzRelay();
        }
        _;
    }

    /**
     * @notice Modifier to check if a deposit can be canceled
     * @dev Verifies the caller is the original sender, the deposit hash matches, and the deposit hasn't been relayed
     * @param depositId The ID of the deposit to cancel
     * @param deposit The deposit data structure
     */
    modifier canCancelDeposit(
        uint256 depositId,
        DepositLib.Deposit memory deposit
    ) {
        DepositQueueLib.DepositData memory depositData = depositQueue
            .depositData[depositId];
        if (depositData.sender != _msgSender()) {
            revert OnlySenderCanCancelDeposit();
        }
        bytes32 depositHash = deposit.getHash();
        if (depositData.depositHash != depositHash) {
            revert InvalidDepositHash(depositData.depositHash, depositHash);
        }
        if (depositId <= getLastRelayedDepositId()) {
            revert AlreadyRelayed();
        }
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract with required addresses and parameters
    /// @param _admin The address that will have admin privileges
    /// @param _rollup The address of the Rollup contract
    /// @param _lzRelay The address of the LzRelay contract
    /// @param _withdrawal The address that will have withdrawal privileges
    /// @param _claim The address that will have claim privileges
    /// @param _relayer The address that will have relayer privileges
    /// @param _contribution The address of the Contribution contract
    /// @param initialERC20Tokens Initial list of ERC20 token addresses to support
    function initialize(
        address _admin,
        address _rollup,
        address _lzRelay,
        address _withdrawal,
        address _claim,
        address _relayer,
        address _contribution,
        address[] memory initialERC20Tokens
    ) external initializer {
        if (
            _admin == address(0) ||
            _rollup == address(0) ||
            _lzRelay == address(0) ||
            _withdrawal == address(0) ||
            _claim == address(0) ||
            _relayer == address(0) ||
            _contribution == address(0)
        ) {
            revert AddressZero();
        }
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(RELAYER, _relayer);
        _grantRole(WITHDRAWAL, _withdrawal);
        _grantRole(WITHDRAWAL, _claim);
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __TokenData_init(initialERC20Tokens, SCROLL_CHAIN_INDEX);
        __Pausable_init();
        depositQueue.initialize();
        contribution = IContribution(_contribution);

        rollup = _rollup;
        lzRelay = _lzRelay;

        // Set deployment time to the next day
        deploymentTime = (block.timestamp / 1 days + 1) * 1 days;
    }

    // ToDo: Remove this function in production
	/* HELPER FUNCTION - SHOULD BE REMOVED IN PRODUCTION */
    function simulateBatchDequeue(uint256 upToId) external view returns (bytes32[] memory) {
        return depositQueue.batchDequeueView(upToId);
    }

    /**
     * @notice Sets the AML and eligibility permitter contract addresses
     * @dev Only callable by the admin role
     * @param _amlPermitter The address of the AML permitter contract
     * @param _eligibilityPermitter The address of the eligibility permitter contract
     */
    function setPermitter(
        address _amlPermitter,
        address _eligibilityPermitter
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        amlPermitter = IPermitter(_amlPermitter);
        eligibilityPermitter = IPermitter(_eligibilityPermitter);
        emit PermitterSet(_amlPermitter, _eligibilityPermitter);
    }

    /**
     * @notice Updates the LayerZero Relayer contract address
     * @dev Only callable by the admin role
     * @param _lzRelay The new LayerZero Relay contract address
     */
    function setLzRelayer(address _lzRelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if(_lzRelay == address(0)){
            revert AddressZero();
        }
        lzRelay = _lzRelay;
    }

    /**
     * @notice Sets the withdrawal fee ratio for a specific token
     * @dev Only callable by the admin role. Fee ratio is in basis points (1bp = 0.01%)
     * @param tokenIndex The index of the token to set the fee ratio for
     * @param feeRatio The fee ratio to set (in basis points, max 1500 = 15%)
     */
    function setWithdrawalFeeRatio(
        uint32 tokenIndex,
        uint256 feeRatio
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (feeRatio > WITHDRAWAL_FEE_RATIO_LIMIT) {
            revert WithdrawalFeeRatioExceedsLimit();
        }
        withdrawalFeeRatio[tokenIndex] = feeRatio;
        emit WithdrawalFeeRatioSet(tokenIndex, feeRatio);
    }

    /**
     * @notice Withdraws collected fees for specified tokens to a recipient address
     * @dev Only callable by the admin role. Skips tokens with zero fees
     * @param recipient The address to receive the withdrawn fees
     * @param tokenIndices Array of token indices to withdraw fees for
     */
    function withdrawCollectedFees(
        address recipient,
        uint32[] calldata tokenIndices
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < tokenIndices.length; i++) {
            uint32 tokenIndex = tokenIndices[i];
            uint256 fee = collectedWithdrawalFees[tokenIndex];
            if (fee == 0) {
                continue;
            }
            collectedWithdrawalFees[tokenIndex] = 0;
            TokenInfo memory tokenInfo = getTokenInfo(tokenIndex);
            _sendToken(
                tokenInfo.tokenType,
                tokenInfo.tokenAddress,
                recipient,
                fee,
                tokenInfo.tokenId
            );
            emit WithdrawalFeeWithdrawn(recipient, tokenIndex, fee);
        }
    }

    /**
     * @notice Pauses all deposit operations
     * @dev Only callable by the admin role
     */
    function pauseDeposits() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses all deposit operations
     * @dev Only callable by the admin role
     */
    function unpauseDeposits() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function depositNativeToken(
        bytes32 recipientSaltHash,
        bytes calldata amlPermission,
        bytes calldata eligibilityPermission
    ) external payable whenNotPaused {
        if (msg.value == 0) {
            revert TriedToDepositZero();
        }
        uint32 tokenIndex = getNativeTokenIndex();
        bytes memory encodedData = abi.encodeWithSignature(
            "depositNativeToken(bytes32)",
            recipientSaltHash
        );
        _deposit(
            _msgSender(),
            recipientSaltHash,
            tokenIndex,
            msg.value,
            encodedData,
            amlPermission,
            eligibilityPermission
        );
    }

    function depositERC20(
        address tokenAddress,
        bytes32 recipientSaltHash,
        uint256 amount,
        bytes calldata amlPermission,
        bytes calldata eligibilityPermission
    ) external whenNotPaused {
        if (amount == 0) {
            revert TriedToDepositZero();
        }
        IERC20(tokenAddress).safeTransferFrom(
            _msgSender(),
            address(this),
            amount
        );
        uint32 tokenIndex = _getOrCreateTokenIndex(
            TokenType.ERC20,
            tokenAddress,
            0
        );
        bytes memory encodedData = abi.encodeWithSignature(
            "depositERC20(address,bytes32,uint256)",
            tokenAddress,
            recipientSaltHash,
            amount
        );

        _deposit(
            _msgSender(),
            recipientSaltHash,
            tokenIndex,
            amount,
            encodedData,
            amlPermission,
            eligibilityPermission
        );
    }

    function depositERC721(
        address tokenAddress,
        bytes32 recipientSaltHash,
        uint256 tokenId,
        bytes calldata amlPermission,
        bytes calldata eligibilityPermission
    ) external whenNotPaused {
        IERC721(tokenAddress).transferFrom(
            _msgSender(),
            address(this),
            tokenId
        );
        uint32 tokenIndex = _getOrCreateTokenIndex(
            TokenType.ERC721,
            tokenAddress,
            tokenId
        );
        bytes memory encodedData = abi.encodeWithSignature(
            "depositERC721(address,bytes32,uint256)",
            tokenAddress,
            recipientSaltHash,
            tokenId
        );
        _deposit(
            _msgSender(),
            recipientSaltHash,
            tokenIndex,
            1,
            encodedData,
            amlPermission,
            eligibilityPermission
        );
    }

    function depositERC1155(
        address tokenAddress,
        bytes32 recipientSaltHash,
        uint256 tokenId,
        uint256 amount,
        bytes calldata amlPermission,
        bytes calldata eligibilityPermission
    ) external whenNotPaused {
        if (amount == 0) {
            revert TriedToDepositZero();
        }
        IERC1155(tokenAddress).safeTransferFrom(
            _msgSender(),
            address(this),
            tokenId,
            amount,
            bytes("")
        );
        uint32 tokenIndex = _getOrCreateTokenIndex(
            TokenType.ERC1155,
            tokenAddress,
            tokenId
        );
        bytes memory encodedData = abi.encodeWithSignature(
            "depositERC1155(address,bytes32,uint256,uint256)",
            tokenAddress,
            recipientSaltHash,
            tokenId,
            amount
        );
        _deposit(
            _msgSender(),
            recipientSaltHash,
            tokenIndex,
            amount,
            encodedData,
            amlPermission,
            eligibilityPermission
        );
    }

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
    ) external payable onlyRole(RELAYER) returns (MessagingReceipt memory) {
        bytes32[] memory depositHashes = depositQueue.batchDequeue(
            upToDepositId
        );

        if (depositHashes.length > RELAY_LIMIT) {
            revert RelayLimitExceeded();
        }

        DepositLib.Deposit[] memory deposits = new DepositLib.Deposit[](
            depositHashes.length
        );

        for (uint256 i = 0; i <= depositHashes.length; i++) {
            deposits[i] = depositDetails[depositHashes[i]];
        }

        bytes memory payload = abi.encode(upToDepositId, deposits);

        MessagingReceipt memory receipt = ILzRelay(lzRelay).send{value: msg.value}(
            SCROLL_CHAIN_INDEX,
            payload,
            options
        );

        emit DepositsRelayed(upToDepositId, 0, payload);

        return receipt;
    }

    function claimWithdrawals(
        WithdrawalLib.Withdrawal[] calldata withdrawals
    ) external {
        for (uint256 i = 0; i < withdrawals.length; i++) {
            WithdrawalLib.Withdrawal memory w = withdrawals[i];
            bytes32 withdrawalHash = w.getHash();
            if (claimableWithdrawals[withdrawalHash] == 0) {
                revert WithdrawalNotFound(withdrawalHash);
            }
            uint256 fee = _getWithdrawalFee(w.tokenIndex, w.amount);
            uint256 amountAfterFee = w.amount - fee;
            TokenInfo memory tokenInfo = getTokenInfo(w.tokenIndex);
            delete claimableWithdrawals[withdrawalHash];
            _sendToken(
                tokenInfo.tokenType,
                tokenInfo.tokenAddress,
                w.recipient,
                amountAfterFee,
                tokenInfo.tokenId
            );
            emit ClaimedWithdrawal(w.recipient, withdrawalHash);
            if (fee > 0) {
                collectedWithdrawalFees[w.tokenIndex] += fee;
                emit WithdrawalFeeCollected(w.tokenIndex, fee);
            }
        }
    }

    function cancelDeposit(
        uint256 depositId,
        DepositLib.Deposit calldata deposit
    ) external canCancelDeposit(depositId, deposit) {
        DepositQueueLib.DepositData memory depositData = depositQueue
            .deleteDeposit(depositId);
        TokenInfo memory tokenInfo = getTokenInfo(deposit.tokenIndex);
        _sendToken(
            tokenInfo.tokenType,
            tokenInfo.tokenAddress,
            depositData.sender,
            deposit.amount,
            tokenInfo.tokenId
        );
        emit DepositCanceled(depositId);
    }

    /**
     * @notice Processes both direct withdrawals and claimable withdrawals from LayerZero
     * @dev Only callable through the LzRelay
     * @param withdrawals Array of direct withdrawals to process
     * @param withdrawalHashes Array of withdrawal hashes to mark as claimable
     */
    function processWithdrawals(
        WithdrawalLib.Withdrawal[] calldata withdrawals,
        bytes32[] calldata withdrawalHashes
    ) external onlyWithdrawalRole {
        _processDirectWithdrawals(withdrawals);
        _processClaimableWithdrawals(withdrawalHashes);
    }

    /**
     * @notice Processes direct withdrawals that can be sent directly to recipients
     * @dev Attempts to send tokens directly to recipients, records contributions for gas payers
     * @param withdrawals Array of withdrawals to process directly
     */
    function _processDirectWithdrawals(
        WithdrawalLib.Withdrawal[] calldata withdrawals
    ) private {
        for (uint256 i = 0; i < withdrawals.length; i++) {
            _processDirectWithdrawal(withdrawals[i]);
        }
        if (withdrawals.length > 0) {
            contribution.recordContribution(
                keccak256("PROCESS_DIRECT_WITHDRAWALS"),
                _msgSender(),
                withdrawals.length
            );
        }
    }

    /**
     * @notice Processes a single direct withdrawal
     * @dev Attempts to send tokens directly to the recipient, collects fees, and handles failures
     * @param withdrawal_ The withdrawal to process
     */
    function _processDirectWithdrawal(
        WithdrawalLib.Withdrawal memory withdrawal_
    ) internal {
        
        TokenInfo memory tokenInfo = getTokenInfo(withdrawal_.tokenIndex);
        uint256 fee = _getWithdrawalFee(
            withdrawal_.tokenIndex,
            withdrawal_.amount
        );
        uint256 amountAfterFee = withdrawal_.amount - fee;
        bool result = true;
        if (tokenInfo.tokenType == TokenType.NATIVE) {
            // solhint-disable-next-line check-send-result
            bool success = payable(withdrawal_.recipient).send(amountAfterFee);
            result = success;
        } else if (tokenInfo.tokenType == TokenType.ERC20) {
            bytes memory transferCall = abi.encodeWithSelector(
                IERC20(tokenInfo.tokenAddress).transfer.selector,
                withdrawal_.recipient,
                amountAfterFee
            );
            result = IERC20(tokenInfo.tokenAddress).callOptionalReturnBool(
                transferCall
            );
        } else {
            // ERC721 and ERC1155 tokens are not supported for direct withdrawals
            result = false;
        }
        if (result) {
            emit DirectWithdrawalSuccessed(
                withdrawal_.getHash(),
                withdrawal_.recipient
            );
            if (fee > 0) {
                // solhint-disable-next-line reentrancy
                collectedWithdrawalFees[withdrawal_.tokenIndex] += fee;
                emit WithdrawalFeeCollected(withdrawal_.tokenIndex, fee);
            }
        } else {
            bytes32 withdrawalHash = withdrawal_.getHash();
            // solhint-disable-next-line reentrancy
            claimableWithdrawals[withdrawalHash] = block.timestamp;
            emit DirectWithdrawalFailed(withdrawalHash, withdrawal_);
            emit WithdrawalClaimable(withdrawalHash);
        }
    }

    /**
     * @notice Marks withdrawals as claimable
     * @dev Sets the timestamp when withdrawals became claimable and records contributions
     * @param withdrawalHashes Array of withdrawal hashes to mark as claimable
     */
    function _processClaimableWithdrawals(
        bytes32[] calldata withdrawalHashes
    ) private {
        for (uint256 i = 0; i < withdrawalHashes.length; i++) {
            claimableWithdrawals[withdrawalHashes[i]] = block.timestamp;
            emit WithdrawalClaimable(withdrawalHashes[i]);
        }
        if (withdrawalHashes.length > 0) {
            contribution.recordContribution(
                keccak256("PROCESS_CLAIMABLE_WITHDRAWALS"),
                _msgSender(),
                withdrawalHashes.length
            );
        }
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @notice Internal function to handle the deposit process for all token types
     * @dev Validates permissions, checks deposit limits, creates deposit hash, and enqueues the deposit
     * @param sender The address making the deposit
     * @param recipientSaltHash The hash of the recipient's address and a secret salt
     * @param tokenIndex The index of the token being deposited
     * @param amount The amount of tokens being deposited
     * @param encodedData The encoded function call data for permission validation
     * @param amlPermission The data to verify AML check
     * @param eligibilityPermission The data to verify eligibility check
     */
    function _deposit(
        address sender,
        bytes32 recipientSaltHash,
        uint32 tokenIndex,
        uint256 amount,
        bytes memory encodedData,
        bytes memory amlPermission,
        bytes memory eligibilityPermission
    ) private {
        // Validate the token belongs to the current chain
        _validateTokenChainId(tokenIndex);
        
        _validateAmlPermission(encodedData, amlPermission);
        bool isEligible = _validateEligibilityPermission(
            encodedData,
            eligibilityPermission
        );
        uint256 depositLimit = DepositLimit.getDepositLimit(
            tokenIndex,
            deploymentTime
        );
        if (amount > depositLimit) {
            revert DepositAmountExceedsLimit(amount, depositLimit);
        }
        DepositLib.Deposit memory deposit = DepositLib.Deposit(sender, recipientSaltHash, amount, tokenIndex, isEligible);
        bytes32 depositHash = DepositLib.getHash(deposit);
        if (doesDepositHashExist[depositHash]) {
            revert DepositHashAlreadyExists(depositHash);
        }
        doesDepositHashExist[depositHash] = true;
        uint256 depositId = depositQueue.enqueue(depositHash, sender);
        depositDetails[depositHash] = deposit;
        emit Deposited(
            depositId,
            sender,
            recipientSaltHash,
            tokenIndex,
            amount,
            isEligible,
            block.timestamp
        );
    }

    /**
     * @notice Internal function to send tokens to a recipient
     * @dev Handles different token types (Native, ERC20, ERC721, ERC1155)
     * @param tokenType The type of token to send
     * @param token The token contract address (not used for native tokens)
     * @param recipient The address to receive the tokens
     * @param amount The amount of tokens to send
     * @param tokenId The token ID (used for ERC721 and ERC1155)
     */
    function _sendToken(
        TokenType tokenType,
        address token,
        address recipient,
        uint256 amount,
        uint256 tokenId
    ) private {
        if (tokenType == TokenType.NATIVE) {
            payable(recipient).transfer(amount);
        } else if (tokenType == TokenType.ERC20) {
            IERC20(token).safeTransfer(recipient, amount);
        } else if (tokenType == TokenType.ERC721) {
            IERC721(token).transferFrom(address(this), recipient, tokenId);
        } else {
            IERC1155(token).safeTransferFrom(
                address(this),
                recipient,
                tokenId,
                amount,
                bytes("")
            );
        }
    }

    /**
     * @notice Validates the AML permission for a deposit
     * @dev Skips validation if no AML permitter is set
     * @param encodedData The encoded function call data
     * @param amlPermission The data to verify AML check
     */
    function _validateAmlPermission(
        bytes memory encodedData,
        bytes memory amlPermission
    ) private {
        if (address(amlPermitter) == address(0)) {
            // if aml permitter is not set, skip aml check
            return;
        }
        bool result = amlPermitter.permit(
            _msgSender(),
            msg.value,
            encodedData,
            amlPermission
        );
        if (!result) {
            revert AmlValidationFailed();
        }
        return;
    }

    /**
     * @notice Validates the eligibility permission for a deposit
     * @dev Skips validation if no eligibility permitter is set
     * @param encodedData The encoded function call data
     * @param eligibilityPermission The data to verify eligibility check
     * @return bool True if the deposit is eligible, false otherwise
     */
    function _validateEligibilityPermission(
        bytes memory encodedData,
        bytes memory eligibilityPermission
    ) private returns (bool) {
        if (address(eligibilityPermitter) == address(0)) {
            // if eligibility permitter is not set, skip eligibility check
            return true;
        }
        if (eligibilityPermission.length == 0) {
            // if eligibility permitter is set but permission doesn't returned, return false.
            return false;
        }
        bool result = eligibilityPermitter.permit(
            _msgSender(),
            msg.value,
            encodedData,
            eligibilityPermission
        );
        if (!result) {
            revert EligibilityValidationFailed();
        }
        return true;
    }

    /**
     * @notice Calculates the withdrawal fee for a given token and amount
     * @dev Fee is calculated as (amount * feeRatio) / 10000
     * @param tokenIndex The index of the token
     * @param amount The amount being withdrawn
     * @return uint256 The calculated fee amount
     */
    function _getWithdrawalFee(
        uint32 tokenIndex,
        uint256 amount
    ) private view returns (uint256) {
        uint256 feeRatio = withdrawalFeeRatio[tokenIndex];
        return (amount * feeRatio) / 10000;
    }

    function isDepositValid(
        uint256 depositId,
        bytes32 recipientSaltHash,
        uint32 tokenIndex,
        uint256 amount,
        bool isEligible,
        address sender
    ) external view returns (bool) {
        DepositQueueLib.DepositData memory depositData = depositQueue
            .depositData[depositId];
        bytes32 depositHash = DepositLib
            .Deposit(sender, recipientSaltHash, amount, tokenIndex, isEligible)
            .getHash();

        if (depositData.depositHash != depositHash) {
            return false;
        }
        if (depositData.sender != sender) {
            return false;
        }
        return true;
    }

    function getDepositData(
        uint256 depositId
    ) external view returns (DepositQueueLib.DepositData memory) {
        return depositQueue.depositData[depositId];
    }

    function getDepositDataBatch(
        uint256[] memory depositIds
    ) external view returns (DepositQueueLib.DepositData[] memory) {
        DepositQueueLib.DepositData[]
            memory depositData = new DepositQueueLib.DepositData[](
                depositIds.length
            );
        for (uint256 i = 0; i < depositIds.length; i++) {
            depositData[i] = depositQueue.depositData[depositIds[i]];
        }
        return depositData;
    }

    function getDepositDataHash(
        uint256 depositId
    ) external view returns (bytes32) {
        return depositQueue.depositData[depositId].depositHash;
    }

    function getLastRelayedDepositId() public view returns (uint256) {
        return depositQueue.front - 1;
    }

    function getLastDepositId() external view returns (uint256) {
        return depositQueue.depositData.length - 1;
    }

    /**
     * @notice Authorizes an upgrade to the implementation
     * @dev Only callable by the admin role
     * @param newImplementation The address of the new implementation
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
