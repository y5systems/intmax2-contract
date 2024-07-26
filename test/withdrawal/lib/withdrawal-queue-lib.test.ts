import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { WithdrawalQueueLibTest } from '../../../typechain-types'

describe.only('WithdrawalQueueLib', () => {
	async function setup(): Promise<WithdrawalQueueLibTest> {
		const libFactory = await ethers.getContractFactory('WithdrawalQueueLibTest')
		const lib = await libFactory.deploy()
		return lib
	}

	describe('initialize', () => {
		it('should set up the initial state correctly', async () => {
			const lib = await loadFixture(setup)

			// Check front and rear indices
			expect(await lib.getFront()).to.equal(1)
			expect(await lib.getRear()).to.equal(1)

			// Check the first element (index 0)
			const firstElement = await lib.getWithdrawalAtIndex(0)
			expect(firstElement.recipient).to.equal(ethers.ZeroAddress)
			expect(firstElement.tokenIndex).to.equal(0)
			expect(firstElement.amount).to.equal(0)
			expect(firstElement.id).to.equal(0)

			// Check queue size and isEmpty
			expect(await lib.size()).to.equal(0)
			expect(await lib.isEmpty()).to.be.true

			// Check data length (should be 1 due to the initial element)
			expect(await lib.getDataLength()).to.equal(1)

			// Try to peek (should revert as queue is empty)
			await expect(lib.peek()).to.be.revertedWithCustomError(
				lib,
				'QueueIsEmpty',
			)
		})
	})

	describe('nextIndex', () => {
		it('should return the correct next index', async () => {
			const lib = await loadFixture(setup)

			// Check initial nextIndex
			expect(await lib.nextIndex()).to.equal(1)

			// Enqueue some elements and check nextIndex
			for (let i = 1; i <= 3; i++) {
				const withdrawal = await lib.createWithdrawal(
					ethers.Wallet.createRandom().address,
					i,
					ethers.parseEther('1'),
					i,
				)
				await lib.enqueue({
					recipient: withdrawal.recipient,
					tokenIndex: withdrawal.tokenIndex,
					amount: withdrawal.amount,
					id: withdrawal.id,
				})
				expect(await lib.nextIndex()).to.equal(i + 1)
			}

			// Dequeue an element and check that nextIndex remains the same
			await lib.dequeue()
			expect(await lib.nextIndex()).to.equal(4)
		})
	})

	describe('enqueue', () => {
		it('should add a withdrawal to the queue and return the correct index', async () => {
			const lib = await loadFixture(setup)

			const withdrawal1 = {
				recipient: ethers.Wallet.createRandom().address,
				tokenIndex: 1,
				amount: ethers.parseEther('1'),
				id: 123,
			}

			const withdrawal2 = {
				recipient: ethers.Wallet.createRandom().address,
				tokenIndex: 2,
				amount: ethers.parseEther('2'),
				id: 456,
			}

			// Enqueue first withdrawal
			await lib.enqueue(withdrawal1)
			expect(await lib.latestIndex()).to.equal(1)
			expect(await lib.size()).to.equal(1)

			// Enqueue second withdrawal
			await lib.enqueue(withdrawal2)
			expect(await lib.latestIndex()).to.equal(2)
			expect(await lib.size()).to.equal(2)

			// Check if withdrawals were added correctly
			const enqueuedWithdrawal1 = await lib.getWithdrawalAtIndex(1)
			const enqueuedWithdrawal2 = await lib.getWithdrawalAtIndex(2)

			expect(enqueuedWithdrawal1.recipient).to.equal(withdrawal1.recipient)
			expect(enqueuedWithdrawal1.tokenIndex).to.equal(withdrawal1.tokenIndex)
			expect(enqueuedWithdrawal1.amount).to.equal(withdrawal1.amount)
			expect(enqueuedWithdrawal1.id).to.equal(withdrawal1.id)

			expect(enqueuedWithdrawal2.recipient).to.equal(withdrawal2.recipient)
			expect(enqueuedWithdrawal2.tokenIndex).to.equal(withdrawal2.tokenIndex)
			expect(enqueuedWithdrawal2.amount).to.equal(withdrawal2.amount)
			expect(enqueuedWithdrawal2.id).to.equal(withdrawal2.id)
		})
	})

	describe('dequeue', () => {
		describe('success', () => {
			it('should remove and return the front withdrawal from the queue', async () => {
				const lib = await loadFixture(setup)

				const withdrawal1 = {
					recipient: ethers.Wallet.createRandom().address,
					tokenIndex: 1,
					amount: ethers.parseEther('1'),
					id: 123,
				}

				const withdrawal2 = {
					recipient: ethers.Wallet.createRandom().address,
					tokenIndex: 2,
					amount: ethers.parseEther('2'),
					id: 456,
				}

				await lib.enqueue(withdrawal1)
				await lib.enqueue(withdrawal2)

				// Dequeue first withdrawal
				await lib.dequeue()
				const dequeuedWithdrawal1 = await lib.latestWithdrawal()

				expect(dequeuedWithdrawal1.recipient).to.equal(withdrawal1.recipient)
				expect(dequeuedWithdrawal1.tokenIndex).to.equal(withdrawal1.tokenIndex)
				expect(dequeuedWithdrawal1.amount).to.equal(withdrawal1.amount)
				expect(dequeuedWithdrawal1.id).to.equal(withdrawal1.id)

				expect(await lib.size()).to.equal(1)

				// Dequeue second withdrawal
				await lib.dequeue()
				const dequeuedWithdrawal2 = await lib.latestWithdrawal()

				expect(dequeuedWithdrawal2.recipient).to.equal(withdrawal2.recipient)
				expect(dequeuedWithdrawal2.tokenIndex).to.equal(withdrawal2.tokenIndex)
				expect(dequeuedWithdrawal2.amount).to.equal(withdrawal2.amount)
				expect(dequeuedWithdrawal2.id).to.equal(withdrawal2.id)

				expect(await lib.size()).to.equal(0)
				expect(await lib.isEmpty()).to.be.true
			})
		})

		describe('fail', () => {
			it('should revert when trying to dequeue from an empty queue', async () => {
				const lib = await loadFixture(setup)

				await expect(lib.dequeue()).to.be.revertedWithCustomError(
					lib,
					'QueueIsEmpty',
				)

				// Enqueue and dequeue to empty the queue, then try again
				const withdrawal = {
					recipient: ethers.Wallet.createRandom().address,
					tokenIndex: 1,
					amount: ethers.parseEther('1'),
					id: 123,
				}
				await lib.enqueue(withdrawal)
				await lib.dequeue()

				await expect(lib.dequeue()).to.be.revertedWithCustomError(
					lib,
					'QueueIsEmpty',
				)
			})
		})
	})

	describe('isEmpty', () => {
		it('should return true for an empty queue', async () => {
			const lib = await loadFixture(setup)
			expect(await lib.isEmpty()).to.be.true

			// Enqueue and dequeue to ensure isEmpty still works correctly
			const withdrawal = {
				recipient: ethers.Wallet.createRandom().address,
				tokenIndex: 1,
				amount: ethers.parseEther('1'),
				id: 123,
			}
			await lib.enqueue(withdrawal)
			expect(await lib.isEmpty()).to.be.false

			await lib.dequeue()
			expect(await lib.isEmpty()).to.be.true
		})

		it('should return false for a non-empty queue', async () => {
			const lib = await loadFixture(setup)
			const withdrawal = {
				recipient: ethers.Wallet.createRandom().address,
				tokenIndex: 1,
				amount: ethers.parseEther('1'),
				id: 123,
			}
			await lib.enqueue(withdrawal)
			expect(await lib.isEmpty()).to.be.false
		})
	})

	describe('size', () => {
		it('should return the correct size of the queue', async () => {
			const lib = await loadFixture(setup)
			expect(await lib.size()).to.equal(0)

			const withdrawal1 = {
				recipient: ethers.Wallet.createRandom().address,
				tokenIndex: 1,
				amount: ethers.parseEther('1'),
				id: 123,
			}
			const withdrawal2 = {
				recipient: ethers.Wallet.createRandom().address,
				tokenIndex: 2,
				amount: ethers.parseEther('2'),
				id: 456,
			}

			await lib.enqueue(withdrawal1)
			expect(await lib.size()).to.equal(1)

			await lib.enqueue(withdrawal2)
			expect(await lib.size()).to.equal(2)

			await lib.dequeue()
			expect(await lib.size()).to.equal(1)

			await lib.dequeue()
			expect(await lib.size()).to.equal(0)
		})
	})

	describe('peek', () => {
		describe('success', () => {
			it('should return the front withdrawal without removing it', async () => {
				const lib = await loadFixture(setup)
				const withdrawal1 = {
					recipient: ethers.Wallet.createRandom().address,
					tokenIndex: 1,
					amount: ethers.parseEther('1'),
					id: 123,
				}
				const withdrawal2 = {
					recipient: ethers.Wallet.createRandom().address,
					tokenIndex: 2,
					amount: ethers.parseEther('2'),
					id: 456,
				}

				await lib.enqueue(withdrawal1)
				await lib.enqueue(withdrawal2)

				const peekedWithdrawal = await lib.peek()
				expect(peekedWithdrawal.recipient).to.equal(withdrawal1.recipient)
				expect(peekedWithdrawal.tokenIndex).to.equal(withdrawal1.tokenIndex)
				expect(peekedWithdrawal.amount).to.equal(withdrawal1.amount)
				expect(peekedWithdrawal.id).to.equal(withdrawal1.id)

				// Ensure the queue size hasn't changed
				expect(await lib.size()).to.equal(2)
			})
		})

		describe('fail', () => {
			it('should revert when trying to peek an empty queue', async () => {
				const lib = await loadFixture(setup)
				await expect(lib.peek()).to.be.revertedWithCustomError(
					lib,
					'QueueIsEmpty',
				)
			})
		})
	})

	describe('integration', () => {
		it('should handle a series of enqueue and dequeue operations correctly', async () => {
			const lib = await loadFixture(setup)
			const withdrawals = []

			// Enqueue 5 withdrawals
			for (let i = 1; i <= 5; i++) {
				const withdrawal = {
					recipient: ethers.Wallet.createRandom().address,
					tokenIndex: i,
					amount: ethers.parseEther(i.toString()),
					id: i * 100,
				}
				withdrawals.push(withdrawal)
				await lib.enqueue(withdrawal)
			}

			expect(await lib.size()).to.equal(5)

			// Dequeue 2 withdrawals
			for (let i = 0; i < 2; i++) {
				await lib.dequeue()
				const dequeuedWithdrawal = await lib.latestWithdrawal()
				expect(dequeuedWithdrawal.recipient).to.equal(withdrawals[i].recipient)
				expect(dequeuedWithdrawal.tokenIndex).to.equal(
					withdrawals[i].tokenIndex,
				)
				expect(dequeuedWithdrawal.amount).to.equal(withdrawals[i].amount)
				expect(dequeuedWithdrawal.id).to.equal(withdrawals[i].id)
			}

			expect(await lib.size()).to.equal(3)

			// Enqueue 2 more withdrawals
			for (let i = 6; i <= 7; i++) {
				const withdrawal = {
					recipient: ethers.Wallet.createRandom().address,
					tokenIndex: i,
					amount: ethers.parseEther(i.toString()),
					id: i * 100,
				}
				withdrawals.push(withdrawal)
				await lib.enqueue(withdrawal)
			}

			expect(await lib.size()).to.equal(5)

			// Peek at the front of the queue
			const peekedWithdrawal = await lib.peek()
			expect(peekedWithdrawal.recipient).to.equal(withdrawals[2].recipient)
			expect(peekedWithdrawal.tokenIndex).to.equal(withdrawals[2].tokenIndex)
			expect(peekedWithdrawal.amount).to.equal(withdrawals[2].amount)
			expect(peekedWithdrawal.id).to.equal(withdrawals[2].id)

			// Dequeue remaining withdrawals
			for (let i = 2; i < withdrawals.length; i++) {
				await lib.dequeue()
				const dequeuedWithdrawal = await lib.latestWithdrawal()
				expect(dequeuedWithdrawal.recipient).to.equal(withdrawals[i].recipient)
				expect(dequeuedWithdrawal.tokenIndex).to.equal(
					withdrawals[i].tokenIndex,
				)
				expect(dequeuedWithdrawal.amount).to.equal(withdrawals[i].amount)
				expect(dequeuedWithdrawal.id).to.equal(withdrawals[i].id)
			}

			expect(await lib.size()).to.equal(0)
			expect(await lib.isEmpty()).to.be.true

			// Try to dequeue from empty queue
			await expect(lib.dequeue()).to.be.revertedWithCustomError(
				lib,
				'QueueIsEmpty',
			)
		})
	})
})
