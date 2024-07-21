import { ethers, network } from 'hardhat'
import type { ContractTransactionResponse } from 'ethers'
import { readDeployedContracts } from '../utils/io'
import { loadFullBlocks, postBlock } from '../../utils/rollup'
import { getRandomSalt } from '../../utils/rand'
import { makeWithdrawalInfo } from '../../utils/withdrawal'
import { sleep } from '../../utils/sleep'
import { IL2ScrollMessenger__factory } from '../../typechain-types'
import { getL2MessengerAddress } from '../utils/addressBook'
import type { SentMessageEvent } from '../../typechain-types/@scroll-tech/contracts/libraries/IScrollMessenger'
import { getLastSentEvent } from '../../utils/events'

const scrollMessengerAbi = IL2ScrollMessenger__factory.abi

if (network.name !== 'scrollSepolia') {
	throw new Error('This script should be run on scrollSepolia network')
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
	// load contracts
	const withdrawal = await ethers.getContractAt(
		'Withdrawal',
		deployedContracts.withdrawal,
	)
	const registry = await ethers.getContractAt(
		'BlockBuilderRegistry',
		deployedContracts.blockBuilderRegistry,
	)
	const rollup = await ethers.getContractAt('Rollup', deployedContracts.rollup)

	let tx: ContractTransactionResponse

	// post dummy block to use as withdrawal public input
	// first register block builder to post block
	tx = await registry.updateBlockBuilder('', {
		value: ethers.parseEther('0.1'),
	})
	console.log('updateBlockBuilder tx hash:', tx.hash)
	await tx.wait()

	await sleep(60)

	// post block
	const fullBlocks = loadFullBlocks()
	tx = await postBlock(fullBlocks[1], rollup)
	console.log('postBlock tx hash:', tx.hash)
	await tx.wait()

	await sleep(60)

	// make withdrawal
	const blockNumber = 1
	const blockHash = await rollup.blockHashes(blockNumber)
	const recipient = (await ethers.getSigners())[0].address
	const ethWithdrawal = {
		recipient,
		tokenIndex: 0,
		amount: ethers.parseEther('0.0001').toString(), // same as deposit amount
		nullifier: getRandomSalt(),
		blockHash,
		blockNumber,
	}
	const aggregator = (await ethers.getSigners())[0].address
	const withdrawalInfo = makeWithdrawalInfo(aggregator, [ethWithdrawal])
	tx = await withdrawal.submitWithdrawalProof(
		withdrawalInfo.withdrawals,
		withdrawalInfo.withdrawalProofPublicInputs,
		'0x',
	)
	console.log('submitWithdrawalProof tx hash:', tx.hash)
	const res = await tx.wait()
	if (!res?.blockNumber) {
		throw new Error('blockNumber not found')
	}
	const submittedBlockNumber = res.blockNumber

	await sleep(60)

	// relay
	tx = await withdrawal.relayWithdrawals(1, 0)
	console.log('relayWithdrawals tx hash:', tx.hash)
	const receipt = await tx.wait()
	if (!receipt?.blockNumber) {
		throw new Error('blockNumber not found')
	}
	const relayedBlockNumber = receipt.blockNumber
	console.log('relayedBlockNumber:', relayedBlockNumber)

	const { messageNonce, message } = (
		await getLastSentEvent(
			getL2MessengerAddress(),
			deployedContracts.withdrawal,
			relayedBlockNumber,
		)
	).args
	console.log('messageNonce:', messageNonce.toString())
	console.log('message:', message)
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
