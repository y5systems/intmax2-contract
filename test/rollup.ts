import { ethers, upgrades } from 'hardhat'
import { expect } from 'chai'
import { rollup } from '../typechain-types/contracts'
import type { Rollup } from '../typechain-types'

describe('Rollup', function () {
	let rollup: Rollup

	this.beforeEach(async function () {
		const rollupFactory = await ethers.getContractFactory('Rollup')
		rollup = (await upgrades.deployProxy(rollupFactory, [], {
			initializer: false,
			kind: 'uups',
		})) as unknown as Rollup
		const zero = ethers.ZeroAddress
		await rollup.initialize(zero, zero, zero, zero) // dummy values
	})

	it('should work', async function () {
		const blocks = await rollup.getBlocks()
		const root = await rollup.getDepositRoot()
		console.log(blocks)
		console.log(root)
	})
})
