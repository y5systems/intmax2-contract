import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { DepositQueueLibTest } from '../../../typechain-types'

describe('DepositQueueLibTest', function () {
	const setup = async (): Promise<DepositQueueLibTest> => {
		const libFactory = await ethers.getContractFactory('DepositQueueLibTest')
		const lib = await libFactory.deploy()
		return lib
	}

	it('should initialize correctly', async function () {
		const lib = await loadFixture(setup)
		expect(await lib.getFront()).to.equal(1)
		expect(await lib.getRear()).to.equal(1)
		expect(await lib.getLastAnalyzedDepositId()).to.equal(0)
		expect(await lib.size()).to.equal(0)
		const depositData = await lib.getDepositData(0)
		expect(depositData.depositHash).to.equal(ethers.ZeroHash)
		expect(depositData.sender).to.equal(ethers.ZeroAddress)
		expect(depositData.isRejected).to.equal(false)
	})

	it('should enqueue deposits correctly', async function () {
		const lib = await loadFixture(setup)
		const depositHash = ethers.randomBytes(32)
		const sender = ethers.Wallet.createRandom().address

		await lib.enqueue(depositHash, sender)
		expect(await lib.size()).to.equal(1)
		expect(await lib.getRear()).to.equal(2)
		expect(await lib.getFront()).to.equal(1)
		expect(await lib.getLastAnalyzedDepositId()).to.equal(0)
		expect(await lib.latestDepositId()).to.equal(1)

		const depositData = await lib.getDepositData(1)
		expect(depositData.depositHash).to.equal(ethers.hexlify(depositHash))
		expect(depositData.sender).to.equal(sender)
		expect(depositData.isRejected).to.be.false
	})
	it('should delete deposit correctly', async function () {
		const lib = await loadFixture(setup)

		// Enqueue a deposit
		const depositHash = ethers.randomBytes(32)
		const sender = ethers.Wallet.createRandom().address
		await lib.enqueue(depositHash, sender)
		const depositId = await lib.latestDepositId()

		// Delete the deposit
		await lib.deleteDeposit(depositId)

		// Check if the deposit is actually deleted
		const emptyDeposit = await lib.getDepositData(depositId)
		expect(emptyDeposit.depositHash).to.equal(ethers.ZeroHash)
		expect(emptyDeposit.sender).to.equal(ethers.ZeroAddress)
		expect(emptyDeposit.isRejected).to.be.false

		// Size should remain the same as deleteDeposit doesn't affect the queue size
		expect(await lib.size()).to.equal(1)
	})

	it('should handle deleting already deleted deposit', async function () {
		const lib = await loadFixture(setup)

		// Enqueue and delete a deposit
		await lib.enqueue(
			ethers.randomBytes(32),
			ethers.Wallet.createRandom().address,
		)
		const depositId = await lib.latestDepositId()
		await lib.deleteDeposit(depositId)

		// Try to delete the same deposit again
		await lib.deleteDeposit(depositId)

		// Check if the returned data is empty
		const deletedDeposit = await lib.getDepositData(depositId)
		expect(deletedDeposit.depositHash).to.equal(ethers.ZeroHash)
		expect(deletedDeposit.sender).to.equal(ethers.ZeroAddress)
		expect(deletedDeposit.isRejected).to.be.false
	})
	it('should analyze deposits correctly', async function () {
		const lib = await loadFixture(setup)

		// Enqueue some deposits
		for (let i = 0; i < 5; i++) {
			await lib.enqueue(
				ethers.randomBytes(32),
				ethers.Wallet.createRandom().address,
			)
		}

		// Analyze deposits
		await lib.analyze(3, [2]) // Reject deposit 2
		expect(await lib.getLastAnalyzedDepositId()).to.equal(3)

		const rejectedDeposit = await lib.getDepositData(2)
		expect(rejectedDeposit.isRejected).to.be.true
	})

	it('should collect accepted deposits correctly', async function () {
		const lib = await loadFixture(setup)

		// Enqueue some deposits
		const depositHashes = []
		for (let i = 0; i < 5; i++) {
			const hash = ethers.randomBytes(32)
			depositHashes.push(hash)
			await lib.enqueue(hash, ethers.Wallet.createRandom().address)
		}

		// Analyze and reject one deposit
		await lib.analyze(5, [2])

		// Collect accepted deposits
		await lib.collectAcceptedDeposits(5)
		const acceptedDeposits = []
		for (let i = 0; i <= 3; i++) {
			const tmp = await lib.latestDepositHashes(i)
			acceptedDeposits.push(tmp)
		}

		expect(acceptedDeposits.length).to.equal(4)
		expect(acceptedDeposits).to.include(ethers.hexlify(depositHashes[0]))
		const rejectedDeposit1 = await lib.getDepositData(1)
		// initial data
		expect(rejectedDeposit1.depositHash).to.equal(ethers.ZeroHash)
		expect(rejectedDeposit1.sender).to.equal(ethers.ZeroAddress)
		expect(rejectedDeposit1.isRejected).to.be.false

		expect(acceptedDeposits).to.not.include(ethers.hexlify(depositHashes[1])) // Index 2 was rejected
		const rejectedDeposit2 = await lib.getDepositData(2)
		expect(rejectedDeposit2.depositHash).to.not.equal(ethers.ZeroHash)
		expect(rejectedDeposit2.sender).to.not.equal(ethers.ZeroAddress)
		expect(rejectedDeposit2.isRejected).to.be.true

		expect(acceptedDeposits).to.include(ethers.hexlify(depositHashes[2]))
		const rejectedDeposit3 = await lib.getDepositData(3)
		expect(rejectedDeposit3.depositHash).to.equal(ethers.ZeroHash)
		expect(rejectedDeposit3.sender).to.equal(ethers.ZeroAddress)
		expect(rejectedDeposit3.isRejected).to.be.false

		expect(acceptedDeposits).to.include(ethers.hexlify(depositHashes[3]))
		const rejectedDeposit4 = await lib.getDepositData(4)
		expect(rejectedDeposit4.depositHash).to.equal(ethers.ZeroHash)
		expect(rejectedDeposit4.sender).to.equal(ethers.ZeroAddress)
		expect(rejectedDeposit4.isRejected).to.be.false

		expect(acceptedDeposits).to.include(ethers.hexlify(depositHashes[4]))
		const rejectedDeposit5 = await lib.getDepositData(5)
		expect(rejectedDeposit5.depositHash).to.equal(ethers.ZeroHash)
		expect(rejectedDeposit5.sender).to.equal(ethers.ZeroAddress)
		expect(rejectedDeposit5.isRejected).to.be.false

		// Check if front is updated
		expect(await lib.getFront()).to.equal(6)
	})

	it("should revert when trying to analyze deposits that don't exist", async function () {
		const lib = await loadFixture(setup)
		await expect(lib.analyze(1, []))
			.to.be.revertedWithCustomError(lib, 'TriedAnalyzeNotExists')
			.withArgs(1, 1)
	})

	it("should revert when trying to collect deposits that haven't been analyzed", async function () {
		const lib = await loadFixture(setup)
		await lib.enqueue(
			ethers.randomBytes(32),
			ethers.Wallet.createRandom().address,
		)
		await expect(lib.collectAcceptedDeposits(1))
			.to.be.revertedWithCustomError(lib, 'TriedCollectDepositsNotAnalyzedYet')
			.withArgs(1, 0)
	})

	it('should revert with UpToDepositIdIsTooOld when analyzing old deposits', async function () {
		const lib = await loadFixture(setup)

		// Enqueue some deposits
		for (let i = 0; i < 5; i++) {
			await lib.enqueue(
				ethers.randomBytes(32),
				ethers.Wallet.createRandom().address,
			)
		}

		// Analyze deposits up to ID 3
		await lib.analyze(3, [])

		// Try to analyze deposits up to ID 2 (which is older than the last analyzed ID)
		await expect(lib.analyze(2, []))
			.to.be.revertedWithCustomError(lib, 'UpToDepositIdIsTooOld')
			.withArgs(2, 3)
	})

	it('should revert with TriedToRejectOutOfRange when rejecting invalid deposit', async function () {
		const lib = await loadFixture(setup)

		// Enqueue some deposits
		for (let i = 0; i < 5; i++) {
			await lib.enqueue(
				ethers.randomBytes(32),
				ethers.Wallet.createRandom().address,
			)
		}

		// Try to analyze deposits up to ID 3 but reject deposit 4 (which is out of range)
		await expect(lib.analyze(3, [4]))
			.to.be.revertedWithCustomError(lib, 'TriedToRejectOutOfRange')
			.withArgs(4, 0, 3)

		// Analyze deposits up to ID 3
		await lib.analyze(3, [])

		// Try to analyze deposits up to ID 5 but reject deposit 1 (which is already analyzed)
		await expect(lib.analyze(5, [1]))
			.to.be.revertedWithCustomError(lib, 'TriedToRejectOutOfRange')
			.withArgs(1, 3, 5)
	})
})
