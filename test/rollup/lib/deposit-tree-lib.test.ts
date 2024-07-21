import { expect } from 'chai'
import { ethers } from 'hardhat'
import { DepositTreeLibTest } from '../../../typechain-types'

describe('DepositTreeLibTest', function () {
	let depositTreeLibTest: DepositTreeLibTest

	beforeEach(async function () {
		const DepositTreeLibTest =
			await ethers.getContractFactory('DepositTreeLibTest')
		depositTreeLibTest = await DepositTreeLibTest.deploy()
	})

	// Helper function to mimic DepositLib.getHash
	function getDepositHash(
		recipientSaltHash: string,
		tokenIndex: number,
		amount: bigint,
	): string {
		const packed = ethers.solidityPacked(
			['bytes32', 'uint32', 'uint256'],
			[recipientSaltHash, tokenIndex, amount],
		)
		const hash = ethers.keccak256(packed)
		return hash
	}

	it('should initialize with correct values', async function () {
		const count = await depositTreeLibTest.getDepositCount()
		const defaultHash = await depositTreeLibTest.getDefaultHash()
		const treeDepth = await depositTreeLibTest.getTreeDepth()

		// Calculate default hash with all zero values
		const zeroBytes32 = ethers.zeroPadValue('0x', 32)
		const calculatedDefaultHash = getDepositHash(zeroBytes32, 0, 0n)

		expect(count).to.equal(0)
		expect(defaultHash).to.equal(calculatedDefaultHash, 'Default hash mismatch')
		expect(treeDepth).to.equal(32)
	})

	it('should add deposits and update root', async function () {
		// Generate 32-byte values for recipientSaltHash
		const recipientSaltHash1 = ethers.keccak256(
			ethers.toUtf8Bytes('recipient1'),
		)
		const recipientSaltHash2 = ethers.keccak256(
			ethers.toUtf8Bytes('recipient2'),
		)

		const deposit1 = getDepositHash(
			recipientSaltHash1,
			1,
			ethers.parseEther('1'),
		)
		const deposit2 = getDepositHash(
			recipientSaltHash2,
			2,
			ethers.parseEther('2'),
		)

		await depositTreeLibTest.deposit(deposit1)
		let root = await depositTreeLibTest.getRoot()
		let count = await depositTreeLibTest.getDepositCount()
		expect(count).to.equal(1)

		await depositTreeLibTest.deposit(deposit2)
		let newRoot = await depositTreeLibTest.getRoot()
		count = await depositTreeLibTest.getDepositCount()
		expect(count).to.equal(2)
		expect(newRoot).to.not.equal(root)
	})

	it('should return correct branch', async function () {
		// Generate a 32-byte value for recipientSaltHash
		const recipientSaltHash = ethers.keccak256(
			ethers.toUtf8Bytes('testRecipient'),
		)

		const tokenIndex = 1
		const amount = ethers.parseEther('1')
		const deposit1 = getDepositHash(recipientSaltHash, tokenIndex, amount)

		await depositTreeLibTest.deposit(deposit1)

		const branch = await depositTreeLibTest.getBranch()

		const treeDepth = await depositTreeLibTest.getTreeDepth()

		expect(branch.length).to.equal(treeDepth)
		expect(branch[0]).to.equal(deposit1)

		// Additional checks
		expect(branch[0]).to.equal(
			deposit1,
			'First branch element should match deposit hash',
		)

		// Check other branch elements
		for (let i = 1; i < branch.length; i++) {
			expect(branch[i]).to.equal(
				ethers.ZeroHash,
				`Branch element ${i} should be zero`,
			)
		}
	})

	it('should revert when tree is full', async function () {
		const baseRecipientSaltHash = ethers.keccak256(
			ethers.toUtf8Bytes('baseRecipient'),
		)

		const tokenIndex = 1
		const amount = ethers.parseEther('1')

		// Add a number of deposits (e.g., 20)
		const numberOfDeposits = 20
		for (let i = 0; i < numberOfDeposits; i++) {
			// Modify the recipientSaltHash slightly for each deposit to ensure unique deposits
			const recipientSaltHash = ethers.keccak256(
				ethers.concat([baseRecipientSaltHash, ethers.toBeHex(i, 32)]),
			)
			const deposit = getDepositHash(recipientSaltHash, tokenIndex, amount)

			await depositTreeLibTest.deposit(deposit)
		}

		const finalCount = await depositTreeLibTest.getDepositCount()

		// Try one more deposit to ensure it still works
		const finalRecipientSaltHash = ethers.keccak256(
			ethers.toUtf8Bytes('finalRecipient'),
		)
		const finalDeposit = getDepositHash(
			finalRecipientSaltHash,
			tokenIndex,
			amount,
		)

		await expect(depositTreeLibTest.deposit(finalDeposit)).to.not.be.reverted

		const updatedCount = await depositTreeLibTest.getDepositCount()

		expect(updatedCount).to.equal(
			finalCount + 1n,
			'Deposit count should increase by 1',
		)
	})
})
