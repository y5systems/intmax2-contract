import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
// HardhatEthersSignerを使うためにimport
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
//import { type BlockBuilderInfoLibTest } from '../../typechain-types/contracts/test/block-builder-registry/BlockBuilderInfoLibTest'
import { BlockBuilderRegistry } from '../../typechain-types/contracts/block-builder-registry/BlockBuilderRegistry'
import { IBlockBuilderRegistry } from '../../typechain-types/contracts/block-builder-registry/BlockBuilderInfoLib'

describe('BlockBuilderRegistry', () => {
	async function setup(): Promise<BlockBuilderRegistry> {
		// const rollupFactory = await ethers.getContractFactory('Rollup')
		// const rollup = await upgrades.deployProxy(rollupFactory, [], {
		// 	initializer: false,
		// 	kind: 'uups',
		// })
		const rollup = ethers.Wallet.createRandom()
		const blockBuilderRegistryFactory = await ethers.getContractFactory(
			'BlockBuilderRegistry',
		)
		const blockBuilderRegistry = await upgrades.deployProxy(
			blockBuilderRegistryFactory,
			[rollup.address],
			{ kind: 'uups' },
		)
		return blockBuilderRegistry as unknown as BlockBuilderRegistry
	}

	// const getDefaultBlockBuilderInfo = (
	// 	_stakeAmount = 0n,
	// 	_stopTime = 0,
	// ): IBlockBuilderRegistry.BlockBuilderInfoStruct => {
	// 	return {
	// 		blockBuilderUrl: '',
	// 		stakeAmount: _stakeAmount,
	// 		stopTime: _stopTime,
	// 		numSlashes: 0,
	// 		isValid: false,
	// 	}
	// }
	type signers = {
		deployer: HardhatEthersSigner
		blockBuilder: HardhatEthersSigner
	}
	const getSigners = async (): Promise<signers> => {
		const [deployer, blockBuilder] = await ethers.getSigners()
		return {
			deployer,
			blockBuilder,
		}
	}
	describe('initialize', () => {
		it('initializeの２回目を実行するとエラーになる', async () => {
			const blockBuilderRegistry = await loadFixture(setup)
			await expect(
				blockBuilderRegistry.initialize(ethers.ZeroAddress),
			).to.be.revertedWithCustomError(
				blockBuilderRegistry,
				'InvalidInitialization',
			)
		})
		it('ownerがdeployerである', async () => {
			const blockBuilderRegistry = await loadFixture(setup)
			const signers = await getSigners()
			expect(await blockBuilderRegistry.owner()).to.equal(
				signers.deployer.address,
			)
		})
	})
	describe('updateBlockBuilder', () => {
		const DUMMY_URL = 'https://dummy.com'
		const getDefaultBlockBuilderInfo =
			(): IBlockBuilderRegistry.BlockBuilderInfoStruct => {
				return {
					blockBuilderUrl: '',
					stakeAmount: 0n,
					stopTime: 0n,
					numSlashes: 0n,
					isValid: false,
				}
			}
		describe('success', () => {
			it('blockBuildersが更新される', async () => {
				const blockBuilderRegistry = await loadFixture(setup)
				const signers = await getSigners()
				const blockBuilderInfoBefore = await blockBuilderRegistry.blockBuilders(
					signers.blockBuilder.address,
				)
				const defaultBlockBuilderInfo = getDefaultBlockBuilderInfo()
				expect(blockBuilderInfoBefore.blockBuilderUrl).to.equal(
					defaultBlockBuilderInfo.blockBuilderUrl,
				)
				expect(blockBuilderInfoBefore.stakeAmount).to.equal(
					defaultBlockBuilderInfo.stakeAmount,
				)
				expect(blockBuilderInfoBefore.stopTime).to.equal(
					defaultBlockBuilderInfo.stopTime,
				)
				expect(blockBuilderInfoBefore.isValid).to.equal(
					defaultBlockBuilderInfo.isValid,
				)

				const stakeAmount = ethers.parseEther('0.3')
				await blockBuilderRegistry
					.connect(signers.blockBuilder)
					.updateBlockBuilder(DUMMY_URL, { value: stakeAmount })
				const blockBuilderInfoAfter = await blockBuilderRegistry.blockBuilders(
					signers.blockBuilder.address,
				)
				expect(blockBuilderInfoAfter.blockBuilderUrl).to.equal(DUMMY_URL)
				expect(blockBuilderInfoAfter.stakeAmount).to.equal(stakeAmount)
				expect(blockBuilderInfoAfter.stopTime).to.equal(0n)
				expect(blockBuilderInfoAfter.numSlashes).to.equal(0n)
				expect(blockBuilderInfoAfter.isValid).to.equal(true)
			})
			it('同一のsenderがupdateBlockBuilderを実行した場合、stakeAmountが更新される', async () => {
				const blockBuilderRegistry = await loadFixture(setup)
				const signers = await getSigners()

				const stakeAmount = ethers.parseEther('0.3')
				await blockBuilderRegistry
					.connect(signers.blockBuilder)
					.updateBlockBuilder(DUMMY_URL, { value: stakeAmount })
				const blockBuilderInfoAfter = await blockBuilderRegistry.blockBuilders(
					signers.blockBuilder.address,
				)
				expect(blockBuilderInfoAfter.blockBuilderUrl).to.equal(DUMMY_URL)
				expect(blockBuilderInfoAfter.stakeAmount).to.equal(stakeAmount)
				expect(blockBuilderInfoAfter.stopTime).to.equal(0n)
				expect(blockBuilderInfoAfter.numSlashes).to.equal(0n)
				expect(blockBuilderInfoAfter.isValid).to.equal(true)

				const stakeAmount2 = ethers.parseEther('0.5')
				await blockBuilderRegistry
					.connect(signers.blockBuilder)
					.updateBlockBuilder(DUMMY_URL, { value: stakeAmount2 })
				const blockBuilderInfoAfter2 = await blockBuilderRegistry.blockBuilders(
					signers.blockBuilder.address,
				)
				expect(blockBuilderInfoAfter2.blockBuilderUrl).to.equal(DUMMY_URL)
				expect(blockBuilderInfoAfter2.stakeAmount).to.equal(
					stakeAmount + stakeAmount2,
				)
				expect(blockBuilderInfoAfter2.stopTime).to.equal(0n)
				expect(blockBuilderInfoAfter2.numSlashes).to.equal(0n)
				expect(blockBuilderInfoAfter2.isValid).to.equal(true)
			})
			it('updateBlockBuilderを実行した場合、BlockBuilderUpdatedイベントが発行される', async () => {
				const blockBuilderRegistry = await loadFixture(setup)
				const signers = await getSigners()
				const stakeAmount = ethers.parseEther('0.3')
				await expect(
					blockBuilderRegistry
						.connect(signers.blockBuilder)
						.updateBlockBuilder(DUMMY_URL, { value: stakeAmount }),
				)
					.to.emit(blockBuilderRegistry, 'BlockBuilderUpdated')
					.withArgs(signers.blockBuilder.address, DUMMY_URL, stakeAmount)
			})
		})
		describe('fail', () => {
			it('stakeAmountの合計数がMIN_STAKE_AMOUNTより小さかった時、InsufficientStakeAmountがrevertされる', async () => {
				const blockBuilderRegistry = await loadFixture(setup)
				const signers = await getSigners()
				await expect(
					blockBuilderRegistry
						.connect(signers.blockBuilder)
						.updateBlockBuilder(DUMMY_URL),
				).to.be.revertedWithCustomError(
					blockBuilderRegistry,
					'InsufficientStakeAmount',
				)
			})
		})
	})
})
