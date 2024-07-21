import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { BlockHashLibTest } from '../../../typechain-types'

describe('BlockHashLib', function () {
	async function deployContractFixture(): Promise<BlockHashLibTest> {
		const BlockHashLibTest = await ethers.getContractFactory('BlockHashLibTest')
		const blockHashLibTest = await BlockHashLibTest.deploy()
		return blockHashLibTest
	}

	describe('Genesis block', function () {
		it('should push genesis block hash correctly', async function () {
			const blockHashLibTest = await loadFixture(deployContractFixture)
			const initialDepositTreeRoot = ethers.randomBytes(32)

			await blockHashLibTest.pushGenesisBlockHash(initialDepositTreeRoot)

			const blockNumber = await blockHashLibTest.getBlockNumber()
			expect(blockNumber).to.equal(
				0n,
				'Block number should be 0 after pushing genesis block',
			)

			const genesisBlockHash = await blockHashLibTest.getBlockHash(0)

			const expectedGenesisHash = ethers.keccak256(
				ethers.solidityPacked(
					['bytes32', 'bytes32', 'bytes32', 'uint32'],
					[ethers.ZeroHash, initialDepositTreeRoot, ethers.ZeroHash, 0],
				),
			)

			expect(genesisBlockHash).to.equal(
				expectedGenesisHash,
				"Genesis block hash doesn't match expected hash",
			)
		})
	})

	describe('Subsequent blocks', function () {
		it('should push and retrieve block hashes correctly', async function () {
			const blockHashLibTest = await loadFixture(deployContractFixture)
			const initialDepositTreeRoot = ethers.randomBytes(32)

			await blockHashLibTest.pushGenesisBlockHash(initialDepositTreeRoot)

			const depositTreeRoot = ethers.randomBytes(32)
			const signatureHash = ethers.randomBytes(32)

			const prevHash = await blockHashLibTest.getPrevHash()

			await blockHashLibTest.pushBlockHash(depositTreeRoot, signatureHash)
			const newBlockHash = await blockHashLibTest.latestBlockHash()

			const updatedBlockNumber = await blockHashLibTest.getBlockNumber()

			const expectedNewHash = ethers.keccak256(
				ethers.solidityPacked(
					['bytes32', 'bytes32', 'bytes32', 'uint32'],
					[prevHash, depositTreeRoot, signatureHash, updatedBlockNumber],
				),
			)

			expect(newBlockHash).to.equal(
				expectedNewHash,
				"New block hash doesn't match expected hash",
			)
		})
	})

	describe('Error handling', function () {
		it('should revert with NoBlocksYet when trying to get block number or previous hash with no blocks', async function () {
			const BlockHashLibTest =
				await ethers.getContractFactory('BlockHashLibTest')
			const blockHashLibTest = await BlockHashLibTest.deploy()

			await expect(
				blockHashLibTest.getBlockNumber(),
			).to.be.revertedWithCustomError(blockHashLibTest, 'NoBlocksYet')

			await expect(
				blockHashLibTest.getPrevHash(),
			).to.be.revertedWithCustomError(blockHashLibTest, 'NoBlocksYet')
		})

		it('should correctly handle the state after adding the genesis block', async function () {
			const BlockHashLibTest =
				await ethers.getContractFactory('BlockHashLibTest')
			const blockHashLibTest = await BlockHashLibTest.deploy()

			const initialDepositTreeRoot = ethers.randomBytes(32)
			await blockHashLibTest.pushGenesisBlockHash(initialDepositTreeRoot)

			const blockNumber = await blockHashLibTest.getBlockNumber()
			expect(blockNumber).to.equal(
				0n,
				'Block number should be 0 after adding genesis block',
			)

			const prevHash = await blockHashLibTest.getPrevHash()
			expect(prevHash).to.be.properHex(
				64,
				'Previous hash should be a valid 32-byte hex string',
			)

			const genesisBlockHash = await blockHashLibTest.getBlockHash(0)
			expect(prevHash).to.equal(
				genesisBlockHash,
				'Previous hash should match genesis block hash',
			)
		})
	})
})
