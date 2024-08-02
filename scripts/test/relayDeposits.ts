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
	const lastRelayedDepositId = await liquidity.getLastRelayedDepositId()
	const lastAnalyzedDepositId = await liquidity.getLastAnalyzedDepositId()
	console.log('lastAnalyzedDepositId:', lastAnalyzedDepositId)
	console.log('lastRelayedDepositId:', lastRelayedDepositId)
	const numDepositsToRelay = lastRelayedDepositId - lastAnalyzedDepositId
	console.log('number of deposits to relay:', numDepositsToRelay)

	// The estimated gas limit is about 220k + 20k * numDeposits. For details, see scripts/test/rollup.ts
	const buffer = 100_000n
	const gasLimit = 220_000n + 20_000n * numDepositsToRelay + buffer
	const tx = await liquidity.relayDeposits(lastAnalyzedDepositId, gasLimit, {
		value: ethers.parseEther('0.1'), // will be refunded
	})
	console.log('relayDeposits tx hash:', tx.hash)
	await tx.wait()
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
