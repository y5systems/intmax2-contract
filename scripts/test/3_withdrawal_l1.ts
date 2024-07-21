import { ethers, network } from 'hardhat'
import type { ContractTransactionResponse } from 'ethers'
import { readDeployedContracts } from '../utils/io'
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

	// load contracts
	const liquidity = await ethers.getContractAt(
		'Liquidity',
		deployedContracts.liquidity,
	)
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
	const messageNonce = 363923
	const message =
		'0x088f0bdd00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

	// you can get the proof from
	// https://sepolia-api-bridge-v2.scroll.io/api/l2/unclaimed/withdrawals?page_size=10&page=1&address={from}
	const proof = {
		batchIndex: 0,
		merkleProof: '0x',
	}
	// tx = await l1ScrollMessenger.relayMessageWithProof(
	// 	from,
	// 	to,
	// 	value,
	// 	messageNonce,
	// 	message,
	// 	proof,
	// )
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
