import { ethers, upgrades } from 'hardhat'
import type { Rollup } from '../typechain-types'
import * as fs from 'fs'
import { expect } from 'chai'

describe('Rollup', function () {
	let rollup: Rollup

	this.beforeEach(async function () {
		const rollupFactory = await ethers.getContractFactory('Rollup')
		rollup = (await upgrades.deployProxy(rollupFactory, [], {
			initializer: false,
			kind: 'uups',
		})) as unknown as Rollup
		await rollup.initialize(
			ethers.ZeroAddress,
			ethers.ZeroAddress,
			ethers.ZeroAddress,
		)
	})

	it('should match block hashes', async function () {
		const fullBlocks = loadFullBlocks()
		for (let i = 1; i < 3; i++) {
			await postBlock(fullBlocks[i], rollup)
		}
		let blocks = []
		for (let i = 0; i < 3; i++) {
			const block = await rollup.blocks(i)
			blocks.push(block)
		}
		expect(blocks[0].hash).to.equal(fullBlocks[0].blockHash)
		expect(blocks[1].hash).to.equal(fullBlocks[1].blockHash)
		expect(blocks[2].hash).to.equal(fullBlocks[2].blockHash)
	})
})

function loadFullBlocks(): FullBlock[] {
	let fullBlocks = []
	for (let i = 0; i < 3; i++) {
		const data = fs.readFileSync(`test_data/block${i}.json`, 'utf8')
		const jsonData = JSON.parse(data) as FullBlock
		fullBlocks.push(jsonData)
	}
	return fullBlocks
}

async function postBlock(fullBlock: FullBlock, rollup: Rollup): Promise<void> {
	if (fullBlock.signature.isRegistorationBlock) {
		if (!fullBlock.pubkeys) {
			throw new Error('pubkeys are required')
		}
		await rollup.postRegistrationBlock(
			fullBlock.signature.txTreeRoot,
			fullBlock.signature.senderFlag,
			fullBlock.signature.aggPubkey,
			fullBlock.signature.aggSignature,
			fullBlock.signature.messagePoint,
			fullBlock.pubkeys,
		)
	} else {
		if (!fullBlock.accountIds) {
			throw new Error('accountIds are required')
		}
		await rollup.postNonRegistrationBlock(
			fullBlock.signature.txTreeRoot,
			fullBlock.signature.senderFlag,
			fullBlock.signature.aggPubkey,
			fullBlock.signature.aggSignature,
			fullBlock.signature.messagePoint,
			fullBlock.signature.pubkeyHash,
			fullBlock.accountIds,
		)
	}
}
