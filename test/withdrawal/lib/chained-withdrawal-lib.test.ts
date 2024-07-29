import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { ChainedWithdrawalLibTest } from '../../../typechain-types'

describe('ChainedWithdrawalLib', () => {
	const setup = async (): Promise<ChainedWithdrawalLibTest> => {
		const factory = await ethers.getContractFactory('ChainedWithdrawalLibTest')
		const contract = await factory.deploy()
		return contract
	}

	describe('verifyWithdrawalChain', () => {
		it('should return true for a valid withdrawal chain', async () => {
			const contract = await loadFixture(setup)

			const withdrawals = [
				{
					recipient: ethers.Wallet.createRandom().address,
					tokenIndex: 1,
					amount: ethers.parseEther('1'),
					nullifier: ethers.randomBytes(32),
					blockHash: ethers.randomBytes(32),
					blockNumber: 1000,
				},
				{
					recipient: ethers.Wallet.createRandom().address,
					tokenIndex: 2,
					amount: ethers.parseEther('2'),
					nullifier: ethers.randomBytes(32),
					blockHash: ethers.randomBytes(32),
					blockNumber: 1001,
				},
			]

			// Calculate the last withdrawal hash manually
			let prevHash = ethers.ZeroHash
			for (const withdrawal of withdrawals) {
				prevHash = ethers.keccak256(
					ethers.solidityPacked(
						[
							'bytes32',
							'address',
							'uint32',
							'uint256',
							'bytes32',
							'bytes32',
							'uint32',
						],
						[
							prevHash,
							withdrawal.recipient,
							withdrawal.tokenIndex,
							withdrawal.amount,
							withdrawal.nullifier,
							withdrawal.blockHash,
							withdrawal.blockNumber,
						],
					),
				)
			}

			const isValid = await contract.verifyWithdrawalChain(
				withdrawals,
				prevHash,
			)
			expect(isValid).to.be.true
		})

		it('should return false for an invalid withdrawal chain', async () => {
			const contract = await loadFixture(setup)

			const withdrawals = [
				{
					recipient: ethers.Wallet.createRandom().address,
					tokenIndex: 1,
					amount: ethers.parseEther('1'),
					nullifier: ethers.randomBytes(32),
					blockHash: ethers.randomBytes(32),
					blockNumber: 1000,
				},
				{
					recipient: ethers.Wallet.createRandom().address,
					tokenIndex: 2,
					amount: ethers.parseEther('2'),
					nullifier: ethers.randomBytes(32),
					blockHash: ethers.randomBytes(32),
					blockNumber: 1001,
				},
			]

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

			const withdrawal = {
				recipient: ethers.Wallet.createRandom().address,
				tokenIndex: 1,
				amount: ethers.parseEther('1'),
				nullifier: ethers.randomBytes(32),
				blockHash: ethers.randomBytes(32),
				blockNumber: 1000,
			}

			const lastWithdrawalHash = ethers.keccak256(
				ethers.solidityPacked(
					[
						'bytes32',
						'address',
						'uint32',
						'uint256',
						'bytes32',
						'bytes32',
						'uint32',
					],
					[
						ethers.ZeroHash,
						withdrawal.recipient,
						withdrawal.tokenIndex,
						withdrawal.amount,
						withdrawal.nullifier,
						withdrawal.blockHash,
						withdrawal.blockNumber,
					],
				),
			)

			const isValid = await contract.verifyWithdrawalChain(
				[withdrawal],
				lastWithdrawalHash,
			)
			expect(isValid).to.be.true
		})
	})
})
