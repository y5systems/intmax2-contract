import { ethers } from 'hardhat'
import { readDeployedContracts } from '../utils/io'

async function main() {
	// note you have to analyze the deposits before relaying them
	const deployedContracts = await readDeployedContracts()
	if (!deployedContracts.liquidity) {
		throw new Error('liquidity contracts should be deployed')
	}
	const liquidity = await ethers.getContractAt(
		'Liquidity',
		deployedContracts.liquidity,
	)
	const lastAnalyzedDepositId = await liquidity.getLastAnalyzedDepositId()
	console.log('lastAnalyzedDepositId:', lastAnalyzedDepositId)

	const tx = await liquidity.relayDeposits(lastAnalyzedDepositId, 800_000, {
		value: ethers.parseEther('0.1'),
	})
	console.log('relayDeposits tx hash:', tx.hash)
	await tx.wait()
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
