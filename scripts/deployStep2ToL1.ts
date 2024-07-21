import { ethers, network, upgrades } from 'hardhat'
import { readDeployedContracts, writeDeployedContracts } from './utils/io'
import {
	getL1MessengerAddress,
	getUSDCAddress,
	getWBTCAddress,
} from './constants'

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
		const liquidityFactory = await ethers.getContractFactory('Liquidity')
		const initialERC20Tokens = [getUSDCAddress(), getWBTCAddress()]
		const liquidity = await upgrades.deployProxy(
			liquidityFactory,
			[
				getL1MessengerAddress(),
				deployedContracts.rollup,
				deployedContracts.withdrawal,
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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
