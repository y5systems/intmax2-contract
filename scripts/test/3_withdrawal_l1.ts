import { ethers, network } from 'hardhat'
import type { ContractTransactionResponse } from 'ethers'
import { readDeployedContracts, readL2ToL1Message } from '../utils/io'
import { getL1MessengerAddress } from '../utils/addressBook'
import { IL1ScrollMessenger__factory } from '../../typechain-types'
import { fetchUnclaimedWithdrawals } from '../utils/api'

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
	const l1ScrollMessenger = new ethers.Contract(
		getL1MessengerAddress(),
		scrollMessengerAbi,
		(await ethers.getSigners())[0],
	)
	const data = await fetchUnclaimedWithdrawals(deployedContracts.withdrawal)
	const results = data.data.results
	console.log('unclaimed withdrawals:', results)
	if (results.length === 0) {
		throw new Error('no unclaimed withdrawals')
	}
	const latestResult = results[results.length - 1]
	const claimInfo = latestResult.claim_info
	if (!claimInfo) {
		throw new Error('no claim info')
	}
	if (!claimInfo.claimable) {
		throw new Error('claimable is false')
	}
	console.log(claimInfo)
	const proof = {
		batchIndex: claimInfo.proof.batch_index,
		merkleProof: claimInfo.proof.merkle_proof,
	}
	const tx = await l1ScrollMessenger.relayMessageWithProof(
		claimInfo.from,
		claimInfo.to,
		claimInfo.value,
		claimInfo.nonce,
		claimInfo.message,
		proof,
	)
	console.log('l1 messenger tx:', tx.hash)
	await tx.wait()
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
