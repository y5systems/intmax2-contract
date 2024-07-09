import { ethers, network } from 'hardhat'
import 'dotenv/config'
import contractAddresses from './contractAddresses.json'
import { saveJsonToFile } from './utils/saveJsonToFile'

async function main() {
	if (network.name === 'scrollsepolia' || network.name === 'scroll') {
		// L1 gas price oracle contract is precompiled on Scroll network (L2).
		const l1GasPriceOracleAddress = '0x5300000000000000000000000000000000000002'
		const newContractAddresses = {
			...contractAddresses,
			l1GasPriceOracle: l1GasPriceOracleAddress,
		}

		saveJsonToFile(
			'./scripts/contractAddresses.json',
			JSON.stringify(newContractAddresses, null, 2),
		)

		return
	}

	const l1GasPriceOracleFactory = await ethers.getContractFactory(
		'MockL1GasPriceOracle',
	)
	const l1GasPriceOracle = await l1GasPriceOracleFactory.deploy(160000)
	await l1GasPriceOracle.waitForDeployment()
	const l1GasPriceOracleAddress = await l1GasPriceOracle.getAddress()
	console.log('MockL1GasPriceOracle deployed to:', l1GasPriceOracleAddress)

	const newContractAddresses = {
		...contractAddresses,
		l1GasPriceOracle: l1GasPriceOracleAddress,
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
