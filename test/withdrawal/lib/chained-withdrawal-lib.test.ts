import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { ChainedWithdrawalLibTest } from '../../../typechain-types'
import {
	getPrevHashFromWithdrawals,
	getChainedWithdrawals,
} from '../common.test'

describe('ChainedWithdrawalLib', () => {
	const setup = async (): Promise<ChainedWithdrawalLibTest> => {
		const factory = await ethers.getContractFactory('ChainedWithdrawalLibTest')
		const contract = await factory.deploy()
		return contract
	}

	describe('verifyWithdrawalChain', () => {
		it('should return true for a valid withdrawal chain', async () => {
			const contract = await loadFixture(setup)

			const withdrawals = getChainedWithdrawals(2)
			// Calculate the last withdrawal hash manually
			const prevHash = getPrevHashFromWithdrawals(withdrawals)

			const isValid = await contract.verifyWithdrawalChain(
				withdrawals,
				prevHash,
			)
			expect(isValid).to.be.true
		})

		it('should return false for an invalid withdrawal chain', async () => {
			const contract = await loadFixture(setup)

			const withdrawals = getChainedWithdrawals(2)
			const invalidLastHash = ethers.randomBytes(32)

			const isValid = await contract.verifyWithdrawalChain(
				withdrawals,
				invalidLastHash,
			)
			expect(isValid).to.be.false
		})

		it('should handle an empty withdrawal chain', async () => {
			const contract = await loadFixture(setup)

			const withdrawals: any[] = []
			const lastWithdrawalHash = ethers.ZeroHash

			const isValid = await contract.verifyWithdrawalChain(
				withdrawals,
				lastWithdrawalHash,
			)
			expect(isValid).to.be.true
		})

		it('should handle a single withdrawal in the chain', async () => {
			const contract = await loadFixture(setup)

			const withdrawals = getChainedWithdrawals(1)

			const lastWithdrawalHash = getPrevHashFromWithdrawals(withdrawals)

			const isValid = await contract.verifyWithdrawalChain(
				withdrawals,
				lastWithdrawalHash,
			)
			expect(isValid).to.be.true
		})
	})
})
