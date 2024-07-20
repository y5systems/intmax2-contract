import { ethers, upgrades } from 'hardhat'
import 'dotenv/config'
import { readDeployedContracts, writeDeployedContracts } from './utils/io'

async function main() {
	const deployedContracts = await readDeployedContracts()
	

	if (!deployedContracts.rollup) {
		const rollupFactory = await ethers.getContractFactory('Rollup')
		const rollup = await upgrades.deployProxy(rollupFactory, [], {
			initializer: false,
			kind: 'uups',
		})
		const newContractAddresses = {
			rollup: await rollup.getAddress(),
			...deployedContracts,
		}
		console.log('rollup', newContractAddresses.rollup)
		await writeDeployedContracts(newContractAddresses)
	}

	if (!deployedContracts.blockBuilderRegistry) {
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
		const newContractAddresses = {
			blockBuilderRegistry: await blockBuilderRegistry.getAddress(),
			...deployedContracts,
		}
		console.log(
			'blockBuilderRegistry',
			newContractAddresses.blockBuilderRegistry,
		)
		await writeDeployedContracts(newContractAddresses)
	}

	if (!deployedContracts.withdrawal) {
		const withdrawalFactory = await ethers.getContractFactory('Withdrawal')
		const withdrawal = await upgrades.deployProxy(withdrawalFactory, [], {
			initializer: false,
			kind: 'uups',
		})
		const newContractAddresses = {
			withdrawal: await withdrawal.getAddress(),
			...deployedContracts,
		}
		console.log('withdrawal', newContractAddresses.withdrawal)
		await writeDeployedContracts(newContractAddresses)
	}

	const MockPlonkVerifier_ =
		await ethers.getContractFactory('MockPlonkVerifier')

	if (!deployedContracts.withdrawalPlonkVerifier) {
		const withdrawalVerifier = await MockPlonkVerifier_.deploy()
		const newContractAddresses = {
			withdrawalPlonkVerifier: await withdrawalVerifier.getAddress(),
			...deployedContracts,
		}
		console.log(
			'withdrawalPlonkVerifier',
			newContractAddresses.withdrawalPlonkVerifier,
		)
		await writeDeployedContracts(newContractAddresses)
	}

	if (!deployedContracts.fraudPlonkVerifier) {
		const fraudVerifier = await MockPlonkVerifier_.deploy()
		const newContractAddresses = {
			fraudPlonkVerifier: await fraudVerifier.getAddress(),
			...deployedContracts,
		}
		console.log('fraudPlonkVerifier', newContractAddresses.fraudPlonkVerifier)
		await writeDeployedContracts(newContractAddresses)
	}
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
