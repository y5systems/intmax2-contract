import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import {
	loadFixture,
} from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'

import {
	Rollup,
	BlockBuilderRegistryTestForRollup
} from '../../typechain-types'

describe('Rollup', () => {
	const FIRST_BLOCK_HASH = "0x545cac70c52cf8589c16de1eb85e264d51e18adb15ac810db3f44efa190a1074"
	const FIRST_DEPOSIT_TREE_ROOT = "0xb6155ab566bbd2e341525fd88c43b4d69572bf4afe7df45cd74d6901a172e41c"
	const setup = async (): Promise<[Rollup, BlockBuilderRegistryTestForRollup]> => {
		const blockBuilderRegistryFactory = await ethers.getContractFactory(
			'BlockBuilderRegistryTestForRollup',
		)
		const blockBuilderRegistry = (await blockBuilderRegistryFactory.deploy()) as BlockBuilderRegistryTestForRollup
		const rollupFactory = await ethers.getContractFactory(
			'Rollup',
		)
		const signers = await getSigners()
		const rollup = (await upgrades.deployProxy(
			rollupFactory,
			[signers.l2ScrollMessenger.address, signers.liquidity.address, await blockBuilderRegistry.getAddress()],
			{ kind: 'uups' },
		)) as unknown as Rollup
		return [rollup, blockBuilderRegistry]
	}

	type signers = {
		deployer: HardhatEthersSigner
		l2ScrollMessenger: HardhatEthersSigner
		liquidity: HardhatEthersSigner,
		user: HardhatEthersSigner
	}
	const getSigners = async (): Promise<signers> => {
		const [deployer, l2ScrollMessenger, liquidity, user] =
			await ethers.getSigners()
		return {
			deployer,
			l2ScrollMessenger,
			liquidity,
			user
		}
	}

	describe('initialize', () => {
		describe('success', () => {
			it('should set deployer as the owner', async () => {
				const [rollup] = await loadFixture(setup)
				const signers = await getSigners()
				expect(await rollup.owner()).to.equal(signers.deployer.address)
			})
			it('should update depositTreeRoot', async () => {
				const [rollup] = await loadFixture(setup)
				const depositTreeRoot = await rollup.depositTreeRoot()
				expect(depositTreeRoot).to.equal(FIRST_DEPOSIT_TREE_ROOT)
			})	
			it('should add initial blockHash', async () => {
				const [rollup] = await loadFixture(setup)
				const blockHash = await rollup.blockHashes(0)
				expect(blockHash).to.equal(FIRST_BLOCK_HASH)
			})		
			it('should add initial blockBuilder', async () => {
				const [rollup] = await loadFixture(setup)
				const blockBuilder = await rollup.blockBuilders(0)
				expect(blockBuilder).to.equal(ethers.ZeroAddress)
			})	
		})
		describe('fail', () => {
			it('should revert when initializing twice', async () => {
				const [rollup] = await loadFixture(setup)
				const signers = await getSigners()

				await expect(rollup.initialize(
					signers.l2ScrollMessenger.address,
					signers.liquidity.address,
					ethers.ZeroAddress
				)).to.be.revertedWithCustomError(rollup, "InvalidInitialization")
			})	
		})
	})

	describe('upgrade', () => {
		it('channel contract is upgradable', async () => {
			const [rollup] = await loadFixture(setup)

			const rollup2Factory = await ethers.getContractFactory(
				'Rollup2Test',
			)
			const next = await upgrades.upgradeProxy(
				await rollup.getAddress(),
				rollup2Factory,
			)
			const hash = await rollup.blockHashes(
				0
			)
			expect(hash).to.equal(FIRST_BLOCK_HASH)
			const val = await next.getVal()
			expect(val).to.equal(2)
		})
		it('Cannot upgrade except for a deployer.', async () => {
			const [rollup] = await loadFixture(setup)
			const signers = await getSigners()
			const rollupFactory = await ethers.getContractFactory(
				'Rollup2Test',
				signers.user,
			)
			await expect(
				upgrades.upgradeProxy(
					await rollup.getAddress(),
					rollupFactory,
				),
			)
				.to.be.revertedWithCustomError(
					rollup,
					'OwnableUnauthorizedAccount',
				)
				.withArgs(signers.user.address)
		})
	})
})
