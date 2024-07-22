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
	const lastDepositId = await liquidity.getLastDepositId()
	const tx = await liquidity.analyzeDeposits(lastDepositId, [])
	console.log('analyzeDeposits tx hash:', tx.hash)
	await tx.wait()
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
