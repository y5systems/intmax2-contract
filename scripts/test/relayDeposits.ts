import { ethers } from 'hardhat'
import { readDeployedContracts } from '../utils/io'

async function main() {
	const deployedContracts = await readDeployedContracts()
	if (!deployedContracts.liquidity) {
		throw new Error('liquidity contracts should be deployed')
	}
	const liquidity = await ethers.getContractAt(
		'Liquidity',
		deployedContracts.liquidity,
	)
	const lastAnalyzableDepositId = await liquidity.getLastAnalyzedDepositId()
	console.log('lastAnalyzableDepositId:', lastAnalyzableDepositId)

	const tx = await liquidity.relayDeposits(lastAnalyzableDepositId, 800_000)
	console.log('relayDeposits tx hash:', tx.hash)
	await tx.wait()
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
