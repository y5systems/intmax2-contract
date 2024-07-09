import { ethers } from 'hardhat'
import 'dotenv/config'
import contractAddresses from './contractAddresses.json'
import { saveJsonToFile } from './utils/saveJsonToFile'

async function main() {
	const plonkVerifierFactory =
		await ethers.getContractFactory('MockPlonkVerifier')
	const plonkVerifier = await plonkVerifierFactory.deploy()
	await plonkVerifier.waitForDeployment()
	const plonkVerifierAddress = await plonkVerifier.getAddress()
	console.log('MockPlonkVerifier deployed to:', plonkVerifierAddress)

	const newContractAddresses = {
		...contractAddresses,
		plonkVerifier: plonkVerifierAddress,
	}

	saveJsonToFile(
		'./scripts/contractAddresses.json',
		JSON.stringify(newContractAddresses, null, 2),
	)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
