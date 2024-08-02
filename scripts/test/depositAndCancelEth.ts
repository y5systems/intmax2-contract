import { ethers, network } from 'hardhat'
import { readDeployedContracts } from '../utils/io'
import { getRandomPubkey, getRandomSalt } from '../../utils/rand'
import { getPubkeySaltHash } from '../../utils/hash'
import type { ContractTransactionResponse } from 'ethers'
import { getLastDepositedEvent } from '../../utils/events'

async function main() {
	const deployedContracts = await readDeployedContracts(network.name)
	if (!deployedContracts.liquidity) {
		throw new Error('liquidity contract should not be deployed')
	}
	const liquidity = await ethers.getContractAt(
		'Liquidity',
		deployedContracts.liquidity,
	)

	let tx: ContractTransactionResponse

	const user = (await ethers.getSigners())[0]
	const pubkey = getRandomPubkey() // intmax address of user
	const salt = getRandomSalt() // random salt
	const recipientSaltHash = getPubkeySaltHash(pubkey, salt)
	const deposit = {
		recipientSaltHash,
		tokenIndex: 0,
		amount: ethers.parseEther('0.001'),
	}

	tx = await liquidity.connect(user).depositETH(deposit.recipientSaltHash, {
		value: deposit.amount,
	})
	console.log('deposit tx hash:', tx.hash)
	const res = await tx.wait()
	if (!res?.blockNumber) {
		throw new Error('No block number found')
	}
	const depositedBlockNumber = res.blockNumber
	const depositEvent = await getLastDepositedEvent(
		liquidity,
		user.address,
		depositedBlockNumber,
	)
	const { depositId } = depositEvent.args
	console.log('depositId:', depositId)

	const depositData = await liquidity.getDepositData(depositId)
	console.log('deposit data:', depositData)
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
