import { ethers, network, upgrades } from 'hardhat'
import { readDeployedContracts, writeDeployedContracts } from './utils/io'
import {
	getL1MessengerAddress,
	getUSDCAddress,
	getWBTCAddress,
} from './utils/addressBook'
import { sleep } from '../utils/sleep'

if (network.name !== 'sepolia') {
	throw new Error('This script should be run on sepolia network')
}

async function main() {
	const deployedContracts = await readDeployedContracts()
	if (!deployedContracts.liquidity) {
		if (!deployedContracts.rollup) {
			throw new Error('rollup address is not set')
		}
		if (!deployedContracts.withdrawal) {
			throw new Error('withdrawal address is not set')
		}
		const analyzer = (await ethers.getSigners())[1]
		const liquidityFactory = await ethers.getContractFactory('Liquidity')
		const initialERC20Tokens = [getUSDCAddress(), getWBTCAddress()]
		const liquidity = await upgrades.deployProxy(
			liquidityFactory,
			[
				getL1MessengerAddress(),
				deployedContracts.rollup,
				deployedContracts.withdrawal,
				analyzer.address,
				initialERC20Tokens,
			],
			{
				kind: 'uups',
			},
		)
		const newContractAddresses = {
			liquidity: await liquidity.getAddress(),
			...deployedContracts,
		}
		await writeDeployedContracts(newContractAddresses)
	}

	await sleep(30)

	if (!deployedContracts.mockL1ScrollMessenger) {
		console.log('deploying mockL1ScrollMessenger')
		const MockL1ScrollMessenger_ = await ethers.getContractFactory(
			'MockL1ScrollMessenger',
		)
		const l1ScrollMessenger = await MockL1ScrollMessenger_.deploy()
		const deployedContracts = await readDeployedContracts()
		await writeDeployedContracts({
			mockL1ScrollMessenger: await l1ScrollMessenger.getAddress(),
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
