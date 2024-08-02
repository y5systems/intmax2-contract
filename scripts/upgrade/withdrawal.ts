import { ethers, upgrades, network } from 'hardhat'
import { readDeployedContracts } from '../utils/io'

if (network.name !== 'scrollSepolia') {
	throw new Error('This script should be run on scrollSepolia network')
}

async function main() {
	const deployedContracts = await readDeployedContracts(network.name)
	if (!deployedContracts.withdrawal) {
		throw new Error('withdrawal contract should be deployed')
	}
	const newImplementationFactory = await ethers.getContractFactory('Withdrawal')
	await upgrades.upgradeProxy(
		deployedContracts.withdrawal,
		newImplementationFactory,
	)
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
