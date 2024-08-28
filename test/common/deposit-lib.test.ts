import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { DepositLibTest } from '../../typechain-types'

describe('DepositLib', function () {
	async function deployContractFixture(): Promise<DepositLibTest> {
		const DepositLibTest = await ethers.getContractFactory('DepositLibTest')
		const testLibrary = await DepositLibTest.deploy()
		return testLibrary
	}

	describe('getHash', function () {
		it('should return the correct hash for a deposit', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const depositId = 1
			const recipientSaltHash = ethers.randomBytes(32)
			const tokenIndex = 123
			const amount = ethers.parseEther('1.5')

			const hash = await testLibrary.getHash(
				depositId,
				recipientSaltHash,
				tokenIndex,
				amount,
			)

			// Calculate expected hash
			const expectedHash = ethers.keccak256(
				ethers.solidityPacked(
					['uint256', 'bytes32', 'uint32', 'uint256'],
					[depositId, recipientSaltHash, tokenIndex, amount],
				),
			)

			expect(hash).to.equal(expectedHash)
		})

		it('should return different hashes for different deposits', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const depositId1 = 1
			const recipientSaltHash1 = ethers.randomBytes(32)
			const tokenIndex1 = 123
			const amount1 = ethers.parseEther('1.5')

			const depositId2 = 2
			const recipientSaltHash2 = ethers.randomBytes(32)
			const tokenIndex2 = 456
			const amount2 = ethers.parseEther('2.5')

			const hash1 = await testLibrary.getHash(
				depositId1,
				recipientSaltHash1,
				tokenIndex1,
				amount1,
			)
			const hash2 = await testLibrary.getHash(
				depositId2,
				recipientSaltHash2,
				tokenIndex2,
				amount2,
			)

			expect(hash1).to.not.equal(hash2)
		})

		it('should handle extreme values correctly', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const depositId = ethers.MaxUint256
			const recipientSaltHash = ethers.ZeroHash
			const tokenIndex = 0
			const amount = ethers.MaxUint256

			const hash = await testLibrary.getHash(
				depositId,
				recipientSaltHash,
				tokenIndex,
				amount,
			)

			// Calculate expected hash
			const expectedHash = ethers.keccak256(
				ethers.solidityPacked(
					['uint256', 'bytes32', 'uint32', 'uint256'],
					[depositId, recipientSaltHash, tokenIndex, amount],
				),
			)

			expect(hash).to.equal(expectedHash)
		})
	})
})
