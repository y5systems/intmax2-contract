import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { ContractTransactionResponse } from 'ethers'
import {
	loadFixture,
	time,
} from '@nomicfoundation/hardhat-toolbox/network-helpers'
// HardhatEthersSignerを使うためにimport
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
//import { type BlockBuilderInfoLibTest } from '../../typechain-types/contracts/test/block-builder-registry/BlockBuilderInfoLibTest'
import { BlockBuilderRegistry } from '../../typechain-types/contracts/block-builder-registry/BlockBuilderRegistry'
import { IBlockBuilderRegistry } from '../../typechain-types/contracts/block-builder-registry/BlockBuilderInfoLib'
import { ONE_DAY_SECONDS } from './const.test'

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

	const getGasCost = async (
		res: ContractTransactionResponse,
	): Promise<bigint> => {
		const transaction = await res.wait()
		return ethers.toBigInt(transaction!.gasPrice * transaction!.gasUsed)
	}
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
	const DUMMY_URL = 'https://dummy.com'
	type signers = {
		deployer: HardhatEthersSigner
		blockBuilder: HardhatEthersSigner
		notStakedBlockBuilder: HardhatEthersSigner
		rollup: HardhatEthersSigner
	}
	const getSigners = async (): Promise<signers> => {
		const [deployer, blockBuilder, notStakedBlockBuilder, rollup] =
			await ethers.getSigners()
		return {
			deployer,
			blockBuilder,
			notStakedBlockBuilder,
			rollup,
		}
	}
	const checkBlockBuilderInfo = (
		blockBuilderInfo: [string, bigint, bigint, bigint, boolean] & {
			blockBuilderUrl: string
			stakeAmount: bigint
			stopTime: bigint
			numSlashes: bigint
			isValid: boolean
		},
		blockBuilderInfo2: IBlockBuilderRegistry.BlockBuilderInfoStruct,
	) => {
		expect(blockBuilderInfo.blockBuilderUrl).to.equal(
			blockBuilderInfo2.blockBuilderUrl,
		)
		expect(blockBuilderInfo.stakeAmount).to.equal(blockBuilderInfo2.stakeAmount)
		expect(blockBuilderInfo.stopTime).to.equal(blockBuilderInfo2.stopTime)
		expect(blockBuilderInfo.numSlashes).to.equal(blockBuilderInfo2.numSlashes)
		expect(blockBuilderInfo.isValid).to.equal(blockBuilderInfo2.isValid)
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
		describe('success', () => {
			it('blockBuildersが更新される', async () => {
				const blockBuilderRegistry = await loadFixture(setup)
				const signers = await getSigners()
				const blockBuilderInfoBefore = await blockBuilderRegistry.blockBuilders(
					signers.blockBuilder.address,
				)
				checkBlockBuilderInfo(
					blockBuilderInfoBefore,
					getDefaultBlockBuilderInfo(),
				)

				const stakeAmount = ethers.parseEther('0.3')
				await blockBuilderRegistry
					.connect(signers.blockBuilder)
					.updateBlockBuilder(DUMMY_URL, { value: stakeAmount })
				const blockBuilderInfoAfter = await blockBuilderRegistry.blockBuilders(
					signers.blockBuilder.address,
				)
				checkBlockBuilderInfo(blockBuilderInfoAfter, {
					blockBuilderUrl: DUMMY_URL,
					stakeAmount: stakeAmount,
					stopTime: 0n,
					numSlashes: 0n,
					isValid: true,
				})
			})
			it('基軸通貨がstakeされる', async () => {
				const blockBuilderRegistry = await loadFixture(setup)
				const signers = await getSigners()
				const balanceBefore = await ethers.provider.getBalance(
					signers.blockBuilder.address,
				)
				const stakeAmount = ethers.parseEther('0.3')
				const res = await blockBuilderRegistry
					.connect(signers.blockBuilder)
					.updateBlockBuilder(DUMMY_URL, { value: stakeAmount })
				const gasCost = await getGasCost(res)
				const balanceAfter = await ethers.provider.getBalance(
					signers.blockBuilder.address,
				)
				expect(balanceBefore - stakeAmount - gasCost).to.equal(balanceAfter)
			})
			it('同一のsenderがupdateBlockBuilderを実行した場合、stakeAmountが更新される', async () => {
				const blockBuilderRegistry = await loadFixture(setup)
				const signers = await getSigners()
				const balanceBefore = await ethers.provider.getBalance(
					signers.blockBuilder.address,
				)
				const stakeAmount1 = ethers.parseEther('0.3')
				const res1 = await blockBuilderRegistry
					.connect(signers.blockBuilder)
					.updateBlockBuilder(DUMMY_URL, { value: stakeAmount1 })
				const gasCost1 = await getGasCost(res1)
				const blockBuilderInfoBefore = await blockBuilderRegistry.blockBuilders(
					signers.blockBuilder.address,
				)
				checkBlockBuilderInfo(blockBuilderInfoBefore, {
					blockBuilderUrl: DUMMY_URL,
					stakeAmount: stakeAmount1,
					stopTime: 0n,
					numSlashes: 0n,
					isValid: true,
				})

				const stakeAmount2 = ethers.parseEther('0.5')
				const res2 = await blockBuilderRegistry
					.connect(signers.blockBuilder)
					.updateBlockBuilder(DUMMY_URL, { value: stakeAmount2 })
				const balanceAfter = await ethers.provider.getBalance(
					signers.blockBuilder.address,
				)
				const gasCost2 = await getGasCost(res2)
				const blockBuilderInfoAfter = await blockBuilderRegistry.blockBuilders(
					signers.blockBuilder.address,
				)
				checkBlockBuilderInfo(blockBuilderInfoAfter, {
					blockBuilderUrl: DUMMY_URL,
					stakeAmount: stakeAmount1 + stakeAmount2,
					stopTime: 0n,
					numSlashes: 0n,
					isValid: true,
				})
				expect(
					balanceBefore - stakeAmount1 - stakeAmount2 - gasCost1 - gasCost2,
				).to.equal(balanceAfter)
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
	describe('stopBlockBuilder', () => {
		describe('success', () => {
			it('blockBuilderの情報が更新される', async () => {
				const blockBuilderRegistry = await loadFixture(setup)
				const signers = await getSigners()
				const stakeAmount = ethers.parseEther('0.3')
				await blockBuilderRegistry
					.connect(signers.blockBuilder)
					.updateBlockBuilder(DUMMY_URL, { value: stakeAmount })

				const blockBuilderInfoBefore = await blockBuilderRegistry.blockBuilders(
					signers.blockBuilder.address,
				)
				checkBlockBuilderInfo(blockBuilderInfoBefore, {
					blockBuilderUrl: DUMMY_URL,
					stakeAmount: stakeAmount,
					stopTime: 0n,
					numSlashes: 0n,
					isValid: true,
				})
				await blockBuilderRegistry
					.connect(signers.blockBuilder)
					.stopBlockBuilder()
				const currentTimestamp = await time.latest()
				const blockBuilderInfoAfter = await blockBuilderRegistry.blockBuilders(
					signers.blockBuilder.address,
				)
				checkBlockBuilderInfo(blockBuilderInfoAfter, {
					blockBuilderUrl: DUMMY_URL,
					stakeAmount: stakeAmount,
					stopTime: currentTimestamp,
					numSlashes: 0n,
					isValid: false,
				})
			})
			it('BlockBuilderStoppedイベントが発生する', async () => {
				const blockBuilderRegistry = await loadFixture(setup)
				const signers = await getSigners()
				const stakeAmount = ethers.parseEther('0.3')
				await blockBuilderRegistry
					.connect(signers.blockBuilder)
					.updateBlockBuilder(DUMMY_URL, { value: stakeAmount })

				await expect(
					blockBuilderRegistry.connect(signers.blockBuilder).stopBlockBuilder(),
				)
					.to.emit(blockBuilderRegistry, 'BlockBuilderStopped')
					.withArgs(signers.blockBuilder.address)
			})
		})
		describe('fail', () => {
			it('ステーキングされていない場合、BlockBuilderNotFoundエラーになる', async () => {
				const blockBuilderRegistry = await loadFixture(setup)
				const signers = await getSigners()
				const blockBuilderInfo = await blockBuilderRegistry.blockBuilders(
					signers.notStakedBlockBuilder.address,
				)
				const defaultBlockBuilderInfo = getDefaultBlockBuilderInfo()
				checkBlockBuilderInfo(blockBuilderInfo, defaultBlockBuilderInfo)
				await expect(
					blockBuilderRegistry
						.connect(signers.notStakedBlockBuilder)
						.stopBlockBuilder(),
				).to.be.revertedWithCustomError(
					blockBuilderRegistry,
					'BlockBuilderNotFound',
				)
			})
		})
	})
	describe('unstake', () => {
		const unstakeSetup = async (): Promise<[BlockBuilderRegistry, bigint]> => {
			const blockBuilderRegistry = await loadFixture(setup)
			const signers = await getSigners()
			const stakeAmount = ethers.parseEther('0.3')
			await blockBuilderRegistry
				.connect(signers.blockBuilder)
				.updateBlockBuilder(DUMMY_URL, { value: stakeAmount })

			await blockBuilderRegistry
				.connect(signers.blockBuilder)
				.stopBlockBuilder()
			return [blockBuilderRegistry, stakeAmount]
		}
		describe('success', () => {
			it('blockBuilderの情報が削除される', async () => {
				const [blockBuilderRegistry, stakeAmount] = await unstakeSetup()
				const signers = await getSigners()

				const currentTimestamp = await time.latest()
				const blockBuilderInfoBefore = await blockBuilderRegistry.blockBuilders(
					signers.blockBuilder.address,
				)
				checkBlockBuilderInfo(blockBuilderInfoBefore, {
					blockBuilderUrl: DUMMY_URL,
					stakeAmount: stakeAmount,
					stopTime: currentTimestamp,
					numSlashes: 0n,
					isValid: false,
				})
				await time.increase(ONE_DAY_SECONDS)
				await blockBuilderRegistry.connect(signers.blockBuilder).unstake()
				const blockBuilderInfoAfter = await blockBuilderRegistry.blockBuilders(
					signers.blockBuilder.address,
				)
				checkBlockBuilderInfo(
					blockBuilderInfoAfter,
					getDefaultBlockBuilderInfo(),
				)
			})

			it('stakeした基軸通貨が返却される', async () => {
				const [blockBuilderRegistry, stakeAmount] = await unstakeSetup()
				const signers = await getSigners()
				await time.increase(ONE_DAY_SECONDS)

				const balanceBefore = await ethers.provider.getBalance(
					signers.blockBuilder.address,
				)
				const res = await blockBuilderRegistry
					.connect(signers.blockBuilder)
					.unstake()
				const gasCost = await getGasCost(res)
				const balanceAfter = await ethers.provider.getBalance(
					signers.blockBuilder.address,
				)
				expect(balanceBefore + stakeAmount - gasCost).to.equal(balanceAfter)
			})

			it('BlockBuilderUpdatedイベントが発生する', async () => {
				const [blockBuilderRegistry, stakeAmount] = await unstakeSetup()
				const signers = await getSigners()
				await time.increase(ONE_DAY_SECONDS)
				await expect(
					blockBuilderRegistry.connect(signers.blockBuilder).unstake(),
				)
					.to.emit(blockBuilderRegistry, 'BlockBuilderUpdated')
					.withArgs(signers.blockBuilder.address, DUMMY_URL, stakeAmount)
			})
		})
		describe('fail', () => {
			it('ステーキングしていない場合、BlockBuilderNotFoundエラーになる', async () => {
				const blockBuilderRegistry = await loadFixture(setup)
				const signers = await getSigners()
				const blockBuilderInfo = await blockBuilderRegistry.blockBuilders(
					signers.notStakedBlockBuilder.address,
				)
				const defaultBlockBuilderInfo = getDefaultBlockBuilderInfo()
				checkBlockBuilderInfo(blockBuilderInfo, defaultBlockBuilderInfo)
				await expect(
					blockBuilderRegistry.connect(signers.notStakedBlockBuilder).unstake(),
				).to.be.revertedWithCustomError(
					blockBuilderRegistry,
					'BlockBuilderNotFound',
				)
			})
			it('チャレンジ期間でない場合、CannotUnstakeWithinChallengeDurationエラーが出る', async () => {
				const [blockBuilderRegistry, stakeAmount] = await unstakeSetup()
				const signers = await getSigners()
				await expect(
					blockBuilderRegistry.connect(signers.blockBuilder).unstake(),
				).to.be.revertedWithCustomError(
					blockBuilderRegistry,
					'CannotUnstakeWithinChallengeDuration',
				)
			})
		})
	})
})
