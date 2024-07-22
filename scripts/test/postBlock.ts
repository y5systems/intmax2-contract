import { ethers } from 'hardhat'
import { readDeployedContracts } from '../utils/io'
import type { ContractTransactionResponse } from 'ethers'

async function main() {
	const deployedContracts = await readDeployedContracts()
	if (!deployedContracts.blockBuilderRegistry || !deployedContracts.rollup) {
		throw new Error('blockBuilderRegistry contract should be deployed')
	}
	const registry = await ethers.getContractAt(
		'BlockBuilderRegistry',
		deployedContracts.blockBuilderRegistry,
	)
	const rollup = await ethers.getContractAt('Rollup', deployedContracts.rollup)

	const blockBuilder = (await ethers.getSigners())[0]
	let tx: ContractTransactionResponse

	// check stake amount
	const blockBuilderInfo = await registry.blockBuilders(
		await blockBuilder.getAddress(),
	)
	const stakeAmount = blockBuilderInfo.stakeAmount
	if (ethers.parseEther('0.1') > stakeAmount) {
		console.log('stake amount is not enough. Staking more...')
		tx = await registry
			.connect(blockBuilder)
			.updateBlockBuilder('', { value: ethers.parseEther('0.1') - stakeAmount })
		console.log('update tx hash:', tx.hash)
		await tx.wait()
		console.log('stake amount updated')
	}

	// post block
	const blocks = loadFullBlocks()
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
