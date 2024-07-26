import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { Bytes32QueueLibTest } from '../../../typechain-types'

describe('Bytes32QueueLib', () => {
	async function setup(): Promise<Bytes32QueueLibTest> {
		const libFactory = await ethers.getContractFactory('Bytes32QueueLibTest')
		const lib = await libFactory.deploy()
		return lib
	}

	describe('initialize', () => {
		it('set up first value', async () => {
			const lib = await loadFixture(setup)
			// Check front and rear indices
			expect(await lib.getFront()).to.equal(1)
			expect(await lib.getRear()).to.equal(1)

			// Check the first element (index 0)
			const firstElement = await lib.getDataAtIndex(0)
			expect(firstElement).to.equal(ethers.ZeroHash)

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

			// Check nextIndex for an empty queue
			expect(await lib.nextIndex()).to.equal(1)

			// Add an element and check nextIndex
			await lib.enqueue(ethers.hexlify(ethers.randomBytes(32)))
			expect(await lib.nextIndex()).to.equal(2)

			// Add another element and check nextIndex
			await lib.enqueue(ethers.hexlify(ethers.randomBytes(32)))
			expect(await lib.nextIndex()).to.equal(3)

			// Dequeue an element and check that nextIndex remains the same
			await lib.dequeue()
			expect(await lib.nextIndex()).to.equal(3)

			// Add more elements and check nextIndex
			for (let i = 0; i < 5; i++) {
				await lib.enqueue(ethers.hexlify(ethers.randomBytes(32)))
			}
			expect(await lib.nextIndex()).to.equal(8)

			// Verify that nextIndex always equals rear
			expect(await lib.nextIndex()).to.equal(await lib.getRear())
		})
	})

	describe('enqueue', () => {
		it('should add an element to the queue and return the correct index', async () => {
			const lib = await loadFixture(setup)

			// Prepare test data
			const testData = [
				ethers.hexlify(ethers.randomBytes(32)),
				ethers.hexlify(ethers.randomBytes(32)),
				ethers.hexlify(ethers.randomBytes(32)),
			]

			// Enqueue elements and check results
			for (let i = 0; i < testData.length; i++) {
				await lib.enqueue(testData[i])
				const latestIndex = await lib.latestIndex()

				// Check if the returned index is correct
				expect(latestIndex).to.equal(i + 1)

				// Verify the element was added correctly
				const addedElement = await lib.getDataAtIndex(latestIndex)
				expect(addedElement).to.equal(testData[i])

				// Check if the queue size increased
				expect(await lib.size()).to.equal(i + 1)

				// Check if the rear index increased
				expect(await lib.getRear()).to.equal(i + 2)
			}

			// Verify the final state of the queue
			expect(await lib.isEmpty()).to.be.false
			expect(await lib.getDataLength()).to.equal(testData.length + 1) // +1 for the initial empty element

			// Check if we can retrieve all elements in order
			for (let i = 0; i < testData.length; i++) {
				const element = await lib.getDataAtIndex(i + 1) // +1 because index 0 is the initial empty element
				expect(element).to.equal(testData[i])
			}
		})
	})

	describe('dequeue', () => {
		describe('success', () => {
			it('should remove and return the front element from the queue', async () => {
				const lib = await loadFixture(setup)

				// Prepare test data
				const testData = [
					ethers.hexlify(ethers.randomBytes(32)),
					ethers.hexlify(ethers.randomBytes(32)),
					ethers.hexlify(ethers.randomBytes(32)),
				]

				// Enqueue test data
				for (const data of testData) {
					await lib.enqueue(data)
				}

				// Dequeue and verify each element
				for (let i = 0; i < testData.length; i++) {
					await lib.dequeue()
					const dequeuedValue = await lib.latestValue()

					// Check if the dequeued value is correct
					expect(dequeuedValue).to.equal(testData[i])

					// Verify queue state after dequeue
					expect(await lib.size()).to.equal(testData.length - i - 1)
					expect(await lib.getFront()).to.equal(i + 2) // Front should move forward
				}

				// Verify final queue state
				expect(await lib.isEmpty()).to.be.true
				expect(await lib.size()).to.equal(0)
				expect(await lib.getFront()).to.equal(await lib.getRear())
			})
		})

		describe('fail', () => {
			it('should revert when trying to dequeue from an empty queue', async () => {
				const lib = await loadFixture(setup)

				// Attempt to dequeue from an empty queue
				await expect(lib.dequeue()).to.be.revertedWithCustomError(
					lib,
					'QueueIsEmpty',
				)

				// Enqueue and dequeue an element, then try to dequeue again
				const testData = ethers.hexlify(ethers.randomBytes(32))
				await lib.enqueue(testData)
				await lib.dequeue()

				// Attempt to dequeue from the now empty queue
				await expect(lib.dequeue()).to.be.revertedWithCustomError(
					lib,
					'QueueIsEmpty',
				)
			})
		})
	})

	it('should return true for an empty queue', async () => {
		const lib = await loadFixture(setup)

		// Check initial state
		expect(await lib.isEmpty()).to.be.true

		// Enqueue and dequeue an element, then check again
		const testData = ethers.hexlify(ethers.randomBytes(32))
		await lib.enqueue(testData)
		await lib.dequeue()
		expect(await lib.isEmpty()).to.be.true

		// Enqueue multiple elements, dequeue all, then check
		for (let i = 0; i < 5; i++) {
			await lib.enqueue(ethers.hexlify(ethers.randomBytes(32)))
		}
		for (let i = 0; i < 5; i++) {
			await lib.dequeue()
		}
		expect(await lib.isEmpty()).to.be.true
	})

	it('should return false for a non-empty queue', async () => {
		const lib = await loadFixture(setup)

		// Enqueue an element and check
		await lib.enqueue(ethers.hexlify(ethers.randomBytes(32)))
		expect(await lib.isEmpty()).to.be.false

		// Enqueue more elements and check
		for (let i = 0; i < 4; i++) {
			await lib.enqueue(ethers.hexlify(ethers.randomBytes(32)))
			expect(await lib.isEmpty()).to.be.false
		}

		// Dequeue all but one element and check
		for (let i = 0; i < 4; i++) {
			await lib.dequeue()
			expect(await lib.isEmpty()).to.be.false
		}

		// Verify queue size
		expect(await lib.size()).to.equal(1)
	})

	describe('size', () => {
		it('should return the correct size of the queue', async () => {
			const lib = await loadFixture(setup)

			// Check initial size
			expect(await lib.size()).to.equal(0)

			// Add elements and check size
			const elementsToAdd = 5
			for (let i = 0; i < elementsToAdd; i++) {
				await lib.enqueue(ethers.hexlify(ethers.randomBytes(32)))
				expect(await lib.size()).to.equal(i + 1)
			}

			// Remove elements and check size
			for (let i = elementsToAdd; i > 0; i--) {
				await lib.dequeue()
				expect(await lib.size()).to.equal(i - 1)
			}

			// Check size after removing all elements
			expect(await lib.size()).to.equal(0)

			// Add a large number of elements
			const largeNumber = 100
			for (let i = 0; i < largeNumber; i++) {
				await lib.enqueue(ethers.hexlify(ethers.randomBytes(32)))
			}
			expect(await lib.size()).to.equal(largeNumber)

			// Remove half of the elements
			for (let i = 0; i < largeNumber / 2; i++) {
				await lib.dequeue()
			}
			expect(await lib.size()).to.equal(largeNumber / 2)

			// Verify size matches the difference between rear and front
			const rear = await lib.getRear()
			const front = await lib.getFront()
			expect(await lib.size()).to.equal(rear - front)
		})
	})

	describe('peek', () => {
		describe('success', () => {
			it('should return the front element without removing it', async () => {
				const lib = await loadFixture(setup)

				// Prepare test data
				const testData = [
					ethers.hexlify(ethers.randomBytes(32)),
					ethers.hexlify(ethers.randomBytes(32)),
					ethers.hexlify(ethers.randomBytes(32)),
				]

				// Enqueue test data
				for (const data of testData) {
					await lib.enqueue(data)
				}

				// Peek and verify multiple times
				for (let i = 0; i < testData.length; i++) {
					const peekedElement = await lib.peek()
					expect(peekedElement).to.equal(testData[i])

					// Verify queue state hasn't changed
					expect(await lib.size()).to.equal(testData.length - i)
					expect(await lib.getFront()).to.equal(i + 1)

					// Dequeue to move to the next element
					await lib.dequeue()
				}

				// Verify final queue state
				expect(await lib.size()).to.equal(0)
				expect(await lib.isEmpty()).to.be.true
			})
		})

		describe('fail', () => {
			it('should revert when trying to peek an empty queue', async () => {
				const lib = await loadFixture(setup)

				// Attempt to peek an empty queue
				await expect(lib.peek()).to.be.revertedWithCustomError(
					lib,
					'QueueIsEmpty',
				)

				// Enqueue and dequeue an element, then try to peek again
				const testData = ethers.hexlify(ethers.randomBytes(32))
				await lib.enqueue(testData)
				await lib.dequeue()

				// Attempt to peek the now empty queue
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

			// Prepare test data
			const testData = Array.from({ length: 10 }, () =>
				ethers.hexlify(ethers.randomBytes(32)),
			)

			// Test scenario 1: Enqueue all, then dequeue all
			for (const data of testData) {
				await lib.enqueue(data)
			}
			expect(await lib.size()).to.equal(testData.length)

			for (const expectedData of testData) {
				await lib.dequeue()
				expect(await lib.latestValue()).to.equal(expectedData)
			}
			expect(await lib.isEmpty()).to.be.true

			// Test scenario 2: Alternating enqueue and dequeue
			const halfLength = Math.floor(testData.length / 2)
			for (let i = 0; i < halfLength; i++) {
				await lib.enqueue(testData[i])
				expect(await lib.size()).to.equal(1)
				await lib.dequeue()
				expect(await lib.latestValue()).to.equal(testData[i])
				expect(await lib.isEmpty()).to.be.true
			}

			// Test scenario 3: Enqueue, dequeue partially, then enqueue more
			for (const data of testData) {
				await lib.enqueue(data)
			}
			for (let i = 0; i < halfLength; i++) {
				await lib.dequeue()
				expect(await lib.latestValue()).to.equal(testData[i])
			}
			expect(await lib.size()).to.equal(halfLength)

			const additionalData = Array.from({ length: 5 }, () =>
				ethers.hexlify(ethers.randomBytes(32)),
			)
			for (const data of additionalData) {
				await lib.enqueue(data)
			}
			expect(await lib.size()).to.equal(halfLength + additionalData.length)

			// Verify final state
			for (let i = halfLength; i < testData.length; i++) {
				await lib.dequeue()
				expect(await lib.latestValue()).to.equal(testData[i])
			}
			for (const data of additionalData) {
				await lib.dequeue()
				expect(await lib.latestValue()).to.equal(data)
			}
			expect(await lib.isEmpty()).to.be.true

			// Test scenario 4: Edge case - enqueue to max capacity, then dequeue all
			const maxCapacity = 1000 // Assume a large but reasonable max capacity
			for (let i = 0; i < maxCapacity; i++) {
				await lib.enqueue(ethers.hexlify(ethers.randomBytes(32)))
			}
			expect(await lib.size()).to.equal(maxCapacity)

			for (let i = 0; i < maxCapacity; i++) {
				await lib.dequeue()
			}
			expect(await lib.isEmpty()).to.be.true
		})
	})
})
