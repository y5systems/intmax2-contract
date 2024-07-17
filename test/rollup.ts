import { ethers } from 'hardhat'
import { expect } from 'chai'
import { rollup } from '../typechain-types/contracts'
import type { Rollup } from '../typechain-types'

describe('Rollup', function () {
	let rollup: Rollup

	this.beforeEach(async function () {
		const RollupFactory = await ethers.getContractFactory('Rollup')
		rollup = await RollupFactory.deploy()
	})

	it('should work', async function () {
		await rollup.postRegistrationBlock(0)
	})
})
