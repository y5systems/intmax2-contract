import { ethers, upgrades } from 'hardhat'
import 'dotenv/config'
import { readDeployedContracts, writeDeployedContracts } from './utils/io'

async function main() {
	const deployedContracts = await readDeployedContracts()

	if (!deployedContracts.rollup) {
		console.log('deploying rollup')
		const rollupFactory = await ethers.getContractFactory('Rollup')
		const rollup = await upgrades.deployProxy(rollupFactory, [], {
			initializer: false,
			kind: 'uups',
		})
		const deployedContracts = await readDeployedContracts()
		const newContractAddresses = {
			rollup: await rollup.getAddress(),
			...deployedContracts,
		}
		await writeDeployedContracts(newContractAddresses)
	}

	if (!deployedContracts.blockBuilderRegistry) {
		console.log('deploying blockBuilderRegistry')
		const blockBuilderRegistryFactory = await ethers.getContractFactory(
			'BlockBuilderRegistry',
		)
		const blockBuilderRegistry = await upgrades.deployProxy(
			blockBuilderRegistryFactory,
			[],
			{
				initializer: false,
				kind: 'uups',
			},
		)
		const deployedContracts = await readDeployedContracts()
		const newContractAddresses = {
			blockBuilderRegistry: await blockBuilderRegistry.getAddress(),
			...deployedContracts,
		}
		await writeDeployedContracts(newContractAddresses)
	}

	if (!deployedContracts.withdrawal) {
		console.log('deploying withdrawal')
		const withdrawalFactory = await ethers.getContractFactory('Withdrawal')
		const withdrawal = await upgrades.deployProxy(withdrawalFactory, [], {
			initializer: false,
			kind: 'uups',
		})
		const deployedContracts = await readDeployedContracts()
		const newContractAddresses = {
			withdrawal: await withdrawal.getAddress(),
			...deployedContracts,
		}
		await writeDeployedContracts(newContractAddresses)
	}

	const MockPlonkVerifier_ =
		await ethers.getContractFactory('MockPlonkVerifier')

	if (!deployedContracts.withdrawalPlonkVerifier) {
		console.log('deploying withdrawalPlonkVerifier')
		const withdrawalVerifier = await MockPlonkVerifier_.deploy()
		const deployedContracts = await readDeployedContracts()
		const newContractAddresses = {
			withdrawalPlonkVerifier: await withdrawalVerifier.getAddress(),
			...deployedContracts,
		}
		await writeDeployedContracts(newContractAddresses)
	}

	if (!deployedContracts.fraudPlonkVerifier) {
		console.log('deploying fraudPlonkVerifier')
		const fraudVerifier = await MockPlonkVerifier_.deploy()
		const deployedContracts = await readDeployedContracts()
		const newContractAddresses = {
			fraudPlonkVerifier: await fraudVerifier.getAddress(),
			...deployedContracts,
		}
		await writeDeployedContracts(newContractAddresses)
	}
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
