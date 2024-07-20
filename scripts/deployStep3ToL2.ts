import { ethers } from 'hardhat'
import { readDeployedContracts } from './utils/io'
import { getL2MessengerAddress } from './constants'

async function main() {
	const deployedContracts = await readDeployedContracts()
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

	// setup rollup
	const rollup = await ethers.getContractAt('Rollup', deployedContracts.rollup)
	const withdrawal = await ethers.getContractAt(
		'Withdrawal',
		deployedContracts.withdrawal,
	)
	const registry = await ethers.getContractAt(
		'BlockBuilderRegistry',
		deployedContracts.blockBuilderRegistry,
	)

	await rollup.initialize(
		getL2MessengerAddress(),
		deployedContracts.liquidity,
		deployedContracts.blockBuilderRegistry,
	)
	await withdrawal.initialize(
		getL2MessengerAddress(),
		deployedContracts.withdrawalPlonkVerifier,
		deployedContracts.liquidity,
		deployedContracts.rollup,
		[0, 1, 2], // 0: eth, 1: usdc, 2: wbtc
	)
	await registry.initialize(
		deployedContracts.rollup,
		deployedContracts.fraudPlonkVerifier,
	)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
