import { ethers, upgrades } from 'hardhat'
import type { Withdrawal } from '../typechain-types/contracts/withdrawal'
import * as fs from 'fs'
import { expect } from 'chai'
import { BlockBuilderRegistry, Rollup } from '../typechain-types'
import { loadWithdrawalInfo } from './utils/withdrawal'
import { loadFullBlocks, postBlock } from './utils/rollup'

describe('Withdawal', function () {
	let registry: BlockBuilderRegistry
	let rollup: Rollup
	let withdrawal: Withdrawal

	this.beforeEach(async function () {
		const registryFactory = await ethers.getContractFactory(
			'BlockBuilderRegistry',
		)
		registry = (await upgrades.deployProxy(registryFactory, [], {
			initializer: false,
			kind: 'uups',
		})) as unknown as BlockBuilderRegistry
		const rollupFactory = await ethers.getContractFactory('Rollup')
		rollup = (await upgrades.deployProxy(rollupFactory, [], {
			initializer: false,
			kind: 'uups',
		})) as unknown as Rollup
		await rollup.initialize(
			ethers.ZeroAddress,
			ethers.ZeroAddress,
			await registry.getAddress(),
		)
		const rollupAddress = await rollup.getAddress()

		const mockPlonkVerifierFactory =
			await ethers.getContractFactory('MockPlonkVerifier')
		const mockPlonkVerifier = await mockPlonkVerifierFactory.deploy()
		const mockPlonkVerifierAddress = await mockPlonkVerifier.getAddress()

		const withdrawalFactory = await ethers.getContractFactory('Withdrawal')
		withdrawal = (await upgrades.deployProxy(withdrawalFactory, [], {
			initializer: false,
			kind: 'uups',
		})) as unknown as Withdrawal
		await withdrawal.initialize(
			ethers.ZeroAddress,
			mockPlonkVerifierAddress,
			ethers.ZeroAddress,
			rollupAddress,
			[],
		)
	})

	it('should be able to submit withdraw', async function () {
		// post blocks corresponding to the withdrawal
		// notice this data has to be consistent with the withdrawal data
		await registry.updateBlockBuilder('', { value: ethers.parseEther('0.1') })
		const fullBlocks = loadFullBlocks()
		for (let i = 1; i < 3; i++) {
			await postBlock(fullBlocks[i], rollup)
		}
		// const withdrawalInfo = loadWithdrawalInfo()
		// await withdrawal.submitWithdrawalProof(
		// 	withdrawalInfo.withdrawals,
		// 	withdrawalInfo.withdrawalProofPublicInputs,
		// 	'0x',
		// )
	})
})
