import { ethers, upgrades, network } from 'hardhat'
import { readDeployedContracts } from '../utils/io'

if (network.name !== 'scrollSepolia') {
	throw new Error('This script should be run on scrollSepolia network')
}

async function main() {
	const deployedContracts = await readDeployedContracts(network.name)
	if (!deployedContracts.blockBuilderRegistry) {
		throw new Error('blockBuilderRegistry contract should be deployed')
	}
	const newImplementationFactory = await ethers.getContractFactory(
		'BlockBuilderRegistry',
	)
	await upgrades.upgradeProxy(
		deployedContracts.blockBuilderRegistry,
		newImplementationFactory,
	)
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
