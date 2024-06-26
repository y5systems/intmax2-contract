// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {IScrollMessenger} from "./IScrollMessenger.sol";
import {ILiquidity} from "./ILiquidity.sol";
import {IRollup} from "./Rollup.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract Liquidity is ILiquidity {
    using SafeERC20 for IERC20;

    IScrollMessenger public _scrollMessenger;
    address public _rollupContract;

    uint64 _depositCounter = 0;

    /**
     * @dev List of pending deposit requests. They are added when there is a request from a user
     *  and removed once processed or rejected.
     */
    DepositData[] _pendingDepositData;

    /**
     * @dev List of rejected deposit requests. They are removed once claimed.
     */
    mapping(uint256 => DepositData) _rejectedDepositData;

    uint256 _lastAnalyzedDepositId;
    uint256 _lastProcessedDepositId;

    uint256 _nextTokenIndex;
    TokenInfo[] _tokenIndexList;
    mapping(bytes32 => uint32) _tokenIndexMap;

    modifier OnlyOwner() {
        // TODO
        _;
    }

    modifier OnlyRollupContract() {
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
        _tokenIndexList.push(TokenInfo(TokenType.ETH, address(0), 0));
        bytes32 ethTokenHash = keccak256(
            abi.encodePacked(TokenType.ETH, address(0), uint256(0))
        );
        _tokenIndexMap[ethTokenHash] = 0;
    }

    function updateRollupContract(address newRollupContract) public {
        _rollupContract = newRollupContract;
    }

    function depositETH(bytes32 recipient) public payable {
        _deposit(msg.sender, recipient, 0, msg.value);
    }

    function depositERC20(
        address tokenAddress,
        bytes32 recipient,
        uint256 amount
    ) public {
        require(tokenAddress != address(0), "Invalid token address");

        // IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        uint32 tokenIndex = _getOrCreateTokenIndex(
            TokenType.ERC20,
            tokenAddress,
            uint256(0)
        );
        _deposit(msg.sender, recipient, tokenIndex, amount);
    }

    function depositERC721(
        address tokenAddress,
        bytes32 recipient,
        uint256 tokenId
    ) public {
        // IERC721(tokenAddress).transferFrom(msg.sender, address(this), tokenId);
        uint32 tokenIndex = _getOrCreateTokenIndex(
            TokenType.ERC721,
            tokenAddress,
            tokenId
        );
        _deposit(msg.sender, recipient, tokenIndex, 1);
    }

    function depositERC1155(
        address tokenAddress,
        bytes32 recipient,
        uint256 tokenId,
        uint256 amount
    ) public {
        IERC1155(tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            bytes("")
        );
        uint32 tokenIndex = _getOrCreateTokenIndex(
            TokenType.ERC721,
            tokenAddress,
            tokenId
        );
        _deposit(msg.sender, recipient, tokenIndex, 1);
    }

    /**
     * @notice Withdraw unrejected but outstanding deposits.
     */
    function cancelPendingDeposit(
        uint256 depositId,
        Deposit memory deposit
    ) public {
        DepositData memory depositData = _pendingDepositData[depositId];
        require(
            depositData.sender == msg.sender,
            "Only the recipient can cancel the deposit"
        );
        delete _pendingDepositData[depositId];

        _cancelDeposit(depositData, deposit);

        emit DepositCanceled(depositId);
    }

    /**
     * @notice Withdraw rejected deposits.
     */
    function claimRejectedDeposit(
        uint256 depositId,
        Deposit memory deposit
    ) public {
        DepositData memory depositData = _rejectedDepositData[depositId];
        require(
            depositData.sender == msg.sender,
            "Only the recipient can cancel the deposit"
        );
        delete _rejectedDepositData[depositId];

        _cancelDeposit(depositData, deposit);

        emit DepositCanceled(depositId);
    }

    function processWithdrawals(
        IRollup.Withdrawal[] calldata withdrawals
    ) external {
        // TODO
    }

    function _calcDepositHash(
        Deposit memory deposit
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    deposit.recipientSaltHash,
                    deposit.tokenIndex,
                    deposit.amount
                )
            );
    }

    function _cancelDeposit(
        DepositData memory depositData,
        Deposit memory deposit
    ) internal {
        require(depositData.depositHash != 0, "Invalid deposit hash");
        require(
            depositData.depositHash == _calcDepositHash(deposit),
            "Invalid deposit hash"
        );

        TokenInfo memory tokenInfo = _tokenIndexList[deposit.tokenIndex];
        if (tokenInfo.tokenType == TokenType.ETH) {
            payable(depositData.sender).transfer(deposit.amount);
        } else if (tokenInfo.tokenType == TokenType.ERC20) {
            // IERC20(tokenInfo.tokenAddress).safeTransfer(deposit.sender, deposit.amount);
        } else if (tokenInfo.tokenType == TokenType.ERC721) {
            // IERC721(tokenInfo.tokenAddress).transferFrom(
            //     address(this),
            //     deposit.sender,
            //     tokenInfo.tokenId
            // );
        } else {
            // IERC1155
        }
    }

    function _deposit(
        address sender,
        bytes32 recipientSaltHash,
        uint32 tokenIndex,
        uint256 amount
    ) internal {
        require(
            _depositCounter != type(uint64).max,
            "Deposit counter overflow"
        );
        uint256 depositId = _depositCounter;
        _depositCounter += 1;
        bytes32 depositHash = _calcDepositHash(
            Deposit(recipientSaltHash, tokenIndex, amount)
        );
        _pendingDepositData.push(
            DepositData(depositHash, sender, block.timestamp)
        );

        emit Deposited(
            depositId,
            sender,
            recipientSaltHash,
            tokenIndex,
            amount,
            block.timestamp
        );
    }

    function _calcTokenHash(
        TokenType tokenType,
        address tokenAddress,
        uint256 tokenId
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(tokenType, tokenAddress, tokenId));
    }

    function _getOrCreateTokenIndex(
        TokenType tokenType,
        address tokenAddress,
        uint256 tokenId
    ) internal returns (uint32) {
        bytes32 tokenHash = _calcTokenHash(tokenType, tokenAddress, tokenId);
        if (_tokenIndexMap[tokenHash] == 0) {
            _nextTokenIndex += 1;
            _tokenIndexMap[tokenHash] = uint32(_nextTokenIndex);
            _tokenIndexList.push(TokenInfo(tokenType, tokenAddress, tokenId));
        }
        return _tokenIndexMap[tokenHash];
    }

    function rejectDeposits(
        uint256 lastAnalyzedDepositId,
        uint256[] calldata rejectedDepositIds
    ) public OnlyOwner {
        _lastAnalyzedDepositId = lastAnalyzedDepositId;
        for (uint256 i = 0; i < rejectedDepositIds.length; i++) {
            uint256 rejectedDepositId = rejectedDepositIds[i];
            _rejectedDepositData[rejectedDepositId] = _pendingDepositData[
                rejectedDepositId
            ];
            delete _pendingDepositData[rejectedDepositId];
        }
    }

    function submitDeposits(uint256 lastProcessedDepositId) public {
        // require(
        //     lastProcessedDepositId <= _depositCounter &&
        //         lastProcessedDepositId > _lastProcessedDepositId,
        //     "Invalid last processed deposit index"
        // );
        _lastProcessedDepositId = lastProcessedDepositId;
    }

    function getDepositCounter() public view returns (uint256) {
        return _depositCounter;
    }

    function getPendingDeposit(
        uint256 depositId
    ) public view returns (DepositData memory) {
        return _pendingDepositData[depositId];
    }

    function getRejectedDeposit(
        uint256 depositId
    ) public view returns (DepositData memory) {
        return _rejectedDepositData[depositId];
    }

    function getLastAnalyzedDepositId() public view returns (uint256) {
        return _lastAnalyzedDepositId;
    }

    function getLastProcessedDepositId() public view returns (uint256) {
        return _lastProcessedDepositId;
    }

    function getTokenInfo(
        uint32 tokenIndex
    ) public view returns (TokenInfo memory) {
        return _tokenIndexList[tokenIndex];
    }

    function getTokenIndex(
        TokenType tokenType,
        address tokenAddress,
        uint256 tokenId
    ) public view returns (uint32) {
        bytes32 tokenHash = _calcTokenHash(tokenType, tokenAddress, tokenId);
        return _tokenIndexMap[tokenHash];
    }
}
