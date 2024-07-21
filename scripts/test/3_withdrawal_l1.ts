import { ethers, network } from 'hardhat'
import type { ContractTransactionResponse } from 'ethers'
import { readDeployedContracts, readL1ToL2Data } from '../utils/io'
import { getL1MessengerAddress } from '../utils/addressBook'
import { IL1ScrollMessenger__factory } from '../../typechain-types'

const scrollMessengerAbi = IL1ScrollMessenger__factory.abi

if (network.name !== 'sepolia') {
	throw new Error('This script should be run on sepolia network')
}

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

	let tx: ContractTransactionResponse

	const l1ScrollMessenger = new ethers.Contract(
		getL1MessengerAddress(),
		scrollMessengerAbi,
		(await ethers.getSigners())[0],
	)

	// get event
	const from = deployedContracts.withdrawal
	const to = deployedContracts.liquidity
	const value = 0

	// previous result by getLastSentEvent
	const l1ToL2Data = await readL1ToL2Data()
	tx = await l1ScrollMessenger.relayMessageWithProof(
		from,
		to,
		value,
		l1ToL2Data.messageNonce,
		l1ToL2Data.message,
		l1ToL2Data.proof,
	)
	console.log('l1 messenger tx:', tx.hash)
	await tx.wait()
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
