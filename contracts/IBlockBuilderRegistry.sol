// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IBlockBuilderRegistry {
    /**
     * @notice Block builder information.
     * @param blockBuilderUrl The URL or IP address of Block builder.
     * @param stakeAmount The stake amount of Block Builder.
     * @param stopTime The time when the node declares that it has ceased operations.
     * @param numSlashes The number of times the node has been slashed so far.
     * @param isValid A flag whether the node is not malicious.
     */
    struct BlockBuilderInfo {
        string blockBuilderUrl;
        uint256 stakeAmount;
        uint256 stopTime;
        uint256 numSlashes;
        bool isValid;
    }

    event BlockBuilderUpdated(
        address indexed blockBuilder,
        string url,
        uint256 stakeAmount
    );

    event BlockBuilderStoped(address indexed blockBuilder);

    /**
     * @notice Update block builder.
     * @dev This method is used to register or update the URL or IP address of the block builder.
     * @dev The block builder must send at least 0.1 ETH to this contract to register.
     * @param url The URL or IP address of Block builder.
     */
    function updateBlockBuilder(string memory url) external payable;

    /**
     * @notice Declare that the block builder has stopped.
     * @dev This method must be run before unstake.
     */
    function stopBlockBuilder() external;

    /**
     * @notice unstake after stoping block builder.
     * @dev You cannot unstake within one day of the Block Builder's last block submission.
     *  This is because a fraud proof may be submitted against the posted block, which could result
     *  in a reduction of the stake.
     */
    function unstake() external;

    /**
     * @notice Prove that Block Builder has submitted an incorrect block using ZKP.
     */
    function slashBlockBuilder(
        uint32 blockNumber,
        address blockBuilder,
        address challenger
    ) external;

    function isValidBlockBuilder(
        address blockBuilder
    ) external view returns (bool ok);

    function getBlockBuilder(
        address blockBuilder
    ) external view returns (BlockBuilderInfo memory);
}
