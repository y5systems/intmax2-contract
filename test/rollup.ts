import { ethers, upgrades } from 'hardhat'
import type { BlockBuilderRegistry, Rollup } from '../typechain-types'
import { expect } from 'chai'
import { loadFullBlocks, postBlock } from './utils/rollup'

describe('Rollup', function () {
	let registry: BlockBuilderRegistry
	let rollup: Rollup

	this.beforeEach(async function () {
		const registryFactory = await ethers.getContractFactory(
			'BlockBuilderRegistry',
		)
		registry = (await upgrades.deployProxy(registryFactory, [], {
			initializer: false,
			kind: 'uups',
		})) as unknown as BlockBuilderRegistry

		const rollupFactory = await ethers.getContractFactory('Rollup')
		rollup = (await upgrades.deployProxy(rollupFactory, [], {
			initializer: false,
			kind: 'uups',
		})) as unknown as Rollup
		await rollup.initialize(
			ethers.ZeroAddress,
			ethers.ZeroAddress,
			await registry.getAddress(),
		)
	})

	it('should match block hashes', async function () {
		await registry.updateBlockBuilder('', { value: ethers.parseEther('0.1') })
		const fullBlocks = loadFullBlocks()
		for (let i = 1; i < 3; i++) {
			await postBlock(fullBlocks[i], rollup)
		}
		let blockHashes = []
		for (let i = 0; i < 3; i++) {
			const blockHash = await rollup.blockHashes(i)
			blockHashes.push(blockHash)
		}
		expect(blockHashes[0]).to.equal(fullBlocks[0].blockHash)
		expect(blockHashes[1]).to.equal(fullBlocks[1].blockHash)
		expect(blockHashes[2]).to.equal(fullBlocks[2].blockHash)
	})
})
