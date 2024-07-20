import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { FraudProofPublicInputsLibTest } from '../../../typechain-types'

describe('FraudProofPublicInputsLib', function () {
	async function deployContractFixture(): Promise<FraudProofPublicInputsLibTest> {
		const FraudProofPublicInputsLibTest = await ethers.getContractFactory(
			'FraudProofPublicInputsLibTest',
		)
		const testLibrary = await FraudProofPublicInputsLibTest.deploy()
		return testLibrary
	}

	describe('getHash', function () {
		it('should return the correct hash for given inputs', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const blockHash = ethers.randomBytes(32)
			const blockNumber = 12345
			const challenger = ethers.Wallet.createRandom().address

			// Instead of using createFraudProofPublicInputs, pass the values directly
			const hash = await testLibrary.getHash(blockHash, blockNumber, challenger)

			// Calculate expected hash
			const expectedHash = ethers.keccak256(
				ethers.solidityPacked(
					['bytes32', 'uint32', 'address'],
					[blockHash, blockNumber, challenger],
				),
			)

			expect(hash).to.equal(expectedHash)
		})

		it('should return different hashes for different inputs', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const blockHash1 = ethers.randomBytes(32)
			const blockNumber1 = 12345
			const challenger1 = ethers.Wallet.createRandom().address

			const blockHash2 = ethers.randomBytes(32)
			const blockNumber2 = 67890
			const challenger2 = ethers.Wallet.createRandom().address

			// Pass the values directly for both sets of inputs
			const hash1 = await testLibrary.getHash(
				blockHash1,
				blockNumber1,
				challenger1,
			)
			const hash2 = await testLibrary.getHash(
				blockHash2,
				blockNumber2,
				challenger2,
			)

			expect(hash1).to.not.equal(hash2)
		})
	})
})
