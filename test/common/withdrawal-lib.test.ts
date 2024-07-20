import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { WithdrawalLibTest } from '../../typechain-types'

describe('WithdrawalLib', function () {
	async function deployContractFixture(): Promise<WithdrawalLibTest> {
		const WithdrawalLibTest =
			await ethers.getContractFactory('WithdrawalLibTest')
		const testLibrary = await WithdrawalLibTest.deploy()
		return testLibrary
	}

	describe('getHash', function () {
		it('should return the correct hash for a withdrawal', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const recipient = ethers.Wallet.createRandom().address
			const tokenIndex = 123
			const amount = ethers.parseEther('1.5')
			const id = 1

			const hash = await testLibrary.getHash(recipient, tokenIndex, amount, id)

			// Calculate expected hash
			const expectedHash = ethers.keccak256(
				ethers.solidityPacked(
					['address', 'uint32', 'uint256', 'uint256'],
					[recipient, tokenIndex, amount, id],
				),
			)

			expect(hash).to.equal(expectedHash)
		})

		it('should return different hashes for different withdrawals', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const recipient1 = ethers.Wallet.createRandom().address
			const tokenIndex1 = 123
			const amount1 = ethers.parseEther('1.5')
			const id1 = 1

			const recipient2 = ethers.Wallet.createRandom().address
			const tokenIndex2 = 456
			const amount2 = ethers.parseEther('2.5')
			const id2 = 2

			const hash1 = await testLibrary.getHash(
				recipient1,
				tokenIndex1,
				amount1,
				id1,
			)
			const hash2 = await testLibrary.getHash(
				recipient2,
				tokenIndex2,
				amount2,
				id2,
			)

			expect(hash1).to.not.equal(hash2)
		})

		it('should handle extreme values correctly', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const recipient = ethers.ZeroAddress
			const tokenIndex = 0
			const amount = ethers.MaxUint256
			const id = ethers.MaxUint256

			const hash = await testLibrary.getHash(recipient, tokenIndex, amount, id)

			// Calculate expected hash
			const expectedHash = ethers.keccak256(
				ethers.solidityPacked(
					['address', 'uint32', 'uint256', 'uint256'],
					[recipient, tokenIndex, amount, id],
				),
			)

			expect(hash).to.equal(expectedHash)
		})
	})

	describe('createWithdrawal', function () {
		it('should create a withdrawal with correct values', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const recipient = ethers.Wallet.createRandom().address
			const tokenIndex = 123
			const amount = ethers.parseEther('1.5')
			const id = 1

			const withdrawal = await testLibrary.createWithdrawal(
				recipient,
				tokenIndex,
				amount,
				id,
			)

			expect(withdrawal.recipient).to.equal(recipient)
			expect(withdrawal.tokenIndex).to.equal(tokenIndex)
			expect(withdrawal.amount).to.equal(amount)
			expect(withdrawal.id).to.equal(id)
		})
	})
})
