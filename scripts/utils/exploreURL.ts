import { network } from 'hardhat'
import { DeployedContracts } from '../schema/deployedContractsSchema'
import { readDeployedContracts } from './io'

async function main() {
	const deployedContracts = await readDeployedContracts(network.name)
	if (
		!deployedContracts.rollup ||
		!deployedContracts.withdrawal ||
		!deployedContracts.blockBuilderRegistry ||
		!deployedContracts.withdrawalPlonkVerifier ||
		!deployedContracts.fraudPlonkVerifier ||
		!deployedContracts.liquidity
	) {
		throw new Error('all contracts should be deployed')
	}

	console.log('----------L1 contracts----------')

	const l1Contracts = ['mockL1ScrollMessenger', 'testErc20', 'liquidity']

	// l1 contracts
	for (const contract of l1Contracts) {
		const address = deployedContracts[contract as keyof DeployedContracts]
		if (!address) {
			throw new Error(`${contract} should be deployed`)
		}
		const url = `https://sepolia.etherscan.io/address/${address}`
		console.log(`${contract}: ${url}`)
	}

	console.log('\n----------L2 contracts----------')

	const l2Contracts = [
		'mockL2ScrollMessenger',
		'rollup',
		'withdrawal',
		'blockBuilderRegistry',
		'withdrawalPlonkVerifier',
		'fraudPlonkVerifier',
	]

	// l2 contracts
	for (const contract of l2Contracts) {
		const address = deployedContracts[contract as keyof DeployedContracts]
		if (!address) {
			throw new Error(`${contract} should be deployed`)
		}
		const url = `https://sepolia.scrollscan.com/address/${address}`
		console.log(`${contract}: ${url}`)
	}
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
