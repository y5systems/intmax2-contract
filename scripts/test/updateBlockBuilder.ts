import { ethers } from 'hardhat'
import type { ContractTransactionResponse } from 'ethers'
import { readDeployedContracts } from '../utils/io'

async function main() {
	const deployedContracts = await readDeployedContracts()
	if (!deployedContracts.blockBuilderRegistry) {
		throw new Error('blockBuilderRegistry contract should be deployed')
	}
	const registry = await ethers.getContractAt(
		'BlockBuilderRegistry',
		deployedContracts.blockBuilderRegistry,
	)

	let tx: ContractTransactionResponse

	const blockBuilder = (await ethers.getSigners())[0]

	// check stake amount
	const blockBuilderInfo = await registry.blockBuilders(
		await blockBuilder.getAddress(),
	)
	const stakeAmount = blockBuilderInfo.stakeAmount
	console.log('stake amount:', stakeAmount.toString())

	// update
	const url = 'https://example.com'
	let amount: bigint
	if (ethers.parseEther('0.1') > stakeAmount) {
		amount = ethers.parseEther('0.1') - stakeAmount
	} else {
		amount = 0n
	}
	tx = await registry
		.connect(blockBuilder)
		.updateBlockBuilder(url, { value: amount })
	console.log('update tx hash:', tx.hash)
	await tx.wait()

	// stop
	tx = await registry.connect(blockBuilder).stopBlockBuilder()
	console.log('stop tx hash:', tx.hash)
	await tx.wait()
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
