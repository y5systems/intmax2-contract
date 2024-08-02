import { ethers, upgrades, network } from 'hardhat'
import { readDeployedContracts } from '../utils/io'

if (network.name !== 'sepolia') {
	throw new Error('This script should be run on sepolia network')
}

async function main() {
	const deployedContracts = await readDeployedContracts()
	if (!deployedContracts.liquidity) {
		throw new Error('liquidity contract should be deployed')
	}
	const newImplementationFactory = await ethers.getContractFactory('Liquidity')
	await upgrades.upgradeProxy(
		deployedContracts.liquidity,
		newImplementationFactory,
	)
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
