import { ethers, upgrades } from 'hardhat'
import type { Withdrawal } from '../typechain-types/contracts/withdrawal'
import * as fs from 'fs'
import { expect } from 'chai'
import { Rollup } from '../typechain-types'

describe('Withdawal', function () {
	let withdrawal: Withdrawal

	this.beforeEach(async function () {
		const rollupFactory = await ethers.getContractFactory('Rollup')
		const rollup = (await upgrades.deployProxy(rollupFactory, [], {
			initializer: false,
			kind: 'uups',
		})) as unknown as Rollup
		await rollup.initialize(
			ethers.ZeroAddress,
			ethers.ZeroAddress,
			ethers.ZeroAddress,
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

	it('should be able to withdraw', async function () {
		const withdrawalInfo = loadWithdrawalInfo()
		await withdrawal.submitWithdrawalProof(
			withdrawalInfo.withdrawals,
			withdrawalInfo.withdrawalProofPublicInputs,
			'0x',
		)
	})
})

function loadWithdrawalInfo(): WithdrawalInfo {
	const data = fs.readFileSync(`test_data/withdrawal_info.json`, 'utf8')
	const jsonData = JSON.parse(data) as WithdrawalInfo
	return jsonData
}
