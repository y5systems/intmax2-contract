import { network } from 'hardhat'

if (network.name !== 'sepolia') {
	throw new Error('This script should be run on sepolia network')
}

async function main() {
	
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
