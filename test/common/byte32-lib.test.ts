import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { Byte32LibTest } from '../../typechain-types'

describe('Byte32Lib', function () {
	async function deployContractFixture(): Promise<Byte32LibTest> {
		const Byte32LibTest = await ethers.getContractFactory('Byte32LibTest')
		const testLibrary = await Byte32LibTest.deploy()
		return testLibrary
	}

	describe('split', function () {
		it('should correctly split a bytes32 into 8 uint256 parts', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const input = ethers.hexlify(ethers.randomBytes(32))
			const parts = await testLibrary.split(input)

			expect(parts.length).to.equal(8)

			// Convert BigNumber array to string array
			const stringParts = parts.map((part) => part.toString())

			// Reconstruct the original bytes32 from the parts
			const reconstructed =
				await testLibrary.createBytes32FromUints(stringParts)
			expect(reconstructed).to.equal(input)
		})

		it('should handle a bytes32 with all zeros', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const input = ethers.ZeroHash
			const parts = await testLibrary.split(input)

			expect(parts.length).to.equal(8)
			parts.forEach((part) => expect(part).to.equal(0))
		})

		it('should handle a bytes32 with all ones', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const input = '0x' + 'f'.repeat(64)
			const parts = await testLibrary.split(input)

			expect(parts.length).to.equal(8)
			parts.forEach((part) => expect(part).to.equal(0xffffffff))
		})

		it('should correctly split a bytes32 with mixed values', async function () {
			const testLibrary = await loadFixture(deployContractFixture)

			const input =
				'0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
			const parts = await testLibrary.split(input)

			expect(parts.length).to.equal(8)
			expect(parts[0]).to.equal(0x01234567)
			expect(parts[1]).to.equal(0x89abcdef)
			expect(parts[2]).to.equal(0x01234567)
			expect(parts[3]).to.equal(0x89abcdef)
			expect(parts[4]).to.equal(0x01234567)
			expect(parts[5]).to.equal(0x89abcdef)
			expect(parts[6]).to.equal(0x01234567)
			expect(parts[7]).to.equal(0x89abcdef)

			// Convert BigNumber array to string array
			const stringParts = parts.map((part) => part.toString())

			// Reconstruct and verify
			const reconstructed =
				await testLibrary.createBytes32FromUints(stringParts)
			expect(reconstructed).to.equal(input)
		})
	})
})
