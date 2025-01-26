import { ethers, network, upgrades } from 'hardhat'
import { readDeployedContracts, writeDeployedContracts } from '../utils/io'
import { sleep } from '../../utils/sleep'
import { cleanEnv, str } from 'envalid'

const env = cleanEnv(process.env, {
	ADMIN_ADDRESS: str(),
})

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
		await sleep(30)
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
		await sleep(30)
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
		await sleep(30)
	}

	if (!deployedContracts.claim) {
		console.log('deploying claim')
		const claimFactory = await ethers.getContractFactory('Claim')
		const claim = await upgrades.deployProxy(claimFactory, [], {
			initializer: false,
			kind: 'uups',
		})
		const deployedContracts = await readDeployedContracts()
		const newContractAddresses = {
			claim: await claim.getAddress(),
			...deployedContracts,
		}
		await writeDeployedContracts(newContractAddresses)
		await sleep(30)
	}

	if (!deployedContracts.l2Contribution) {
		console.log('deploying l2Contribution')
		const contributionFactory = await ethers.getContractFactory('Contribution')
		const l2Contribution = await upgrades.deployProxy(
			contributionFactory,
			[env.ADMIN_ADDRESS],
			{
				kind: 'uups',
			},
		)
		const deployedContracts = await readDeployedContracts()
		const newContractAddresses = {
			l2Contribution: await l2Contribution.getAddress(),
			...deployedContracts,
		}
		await writeDeployedContracts(newContractAddresses)
		await sleep(30)
	}

	const WithdrawalPlonkVerifier_ =
		await ethers.getContractFactory('WithdrawalPlonkVerifier')
	const ClaimPlonkVerifier_ = await ethers.getContractFactory('WithdrawalPlonkVerifier')

	if (!deployedContracts.withdrawalPlonkVerifier) {
		console.log('deploying withdrawalPlonkVerifier')
		const withdrawalVerifier = await WithdrawalPlonkVerifier_.deploy()
		const deployedContracts = await readDeployedContracts()
		const newContractAddresses = {
			withdrawalPlonkVerifier: await withdrawalVerifier.getAddress(),
			...deployedContracts,
		}
		await writeDeployedContracts(newContractAddresses)
		await sleep(30)
	}

	if (!deployedContracts.claimPlonkVerifier) {
		console.log('deploying claimPlonkVerifier')
		const claimVerifier = await ClaimPlonkVerifier_.deploy()
		const deployedContracts = await readDeployedContracts()
		const newContractAddresses = {
			claimPlonkVerifier: await claimVerifier.getAddress(),
			...deployedContracts,
		}
		await writeDeployedContracts(newContractAddresses)
		await sleep(30)
	}

	if (!deployedContracts.mockL2ScrollMessenger) {
		console.log('deploying mockL2ScrollMessenger')
		const MockL2ScrollMessenger_ = await ethers.getContractFactory(
			'MockL2ScrollMessenger',
		)
		const l2ScrollMessenger = await MockL2ScrollMessenger_.deploy()
		const deployedContracts = await readDeployedContracts()
		await writeDeployedContracts({
			mockL2ScrollMessenger: await l2ScrollMessenger.getAddress(),
			...deployedContracts,
		})
	}
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
