import { ethers, network } from 'hardhat'
import { readDeployedContracts } from '../utils/io'

if (network.name !== 'sepoliascroll') {
	throw new Error('This script should be run on sepoliascroll network')
}

async function main() {
	const deployedContracts = await readDeployedContracts()
	if (!deployedContracts.withdrawal) {
		throw new Error('No withdrawal contract found')
	}
	const withdrawal = await ethers.getContractAt(
		'Withdrawal',
		deployedContracts.withdrawal,
	)

    
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
