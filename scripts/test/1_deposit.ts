import { ethers, network } from 'hardhat'
import { readDeployedContracts } from '../utils/io'
import { getRandomPubkey, getRandomSalt } from '../../utils/rand'
import { getPubkeySaltHash } from '../../utils/hash'
import { sleep } from '../../utils/sleep'
import type { ContractTransactionResponse } from 'ethers'

if (network.name !== 'sepolia') {
	throw new Error('This script should be run on sepolia network')
}

async function main() {
	const deployedContracts = await readDeployedContracts()
	if (!deployedContracts.liquidity) {
		throw new Error('No liquidity contract found')
	}
	const liquidity = await ethers.getContractAt(
		'Liquidity',
		deployedContracts.liquidity,
	)

	let tx: ContractTransactionResponse

	// deposit
	const pubkey = getRandomPubkey() // intmax address of user
	const salt = getRandomSalt() // random salt
	const pubkeySaltHash = getPubkeySaltHash(pubkey, salt)
	tx = await liquidity.depositETH(pubkeySaltHash, {
		value: ethers.parseEther('0.0001'),
	})
	console.log('deposit tx hash:', tx.hash)
	await tx.wait()

	await sleep(60)

	// analyze
	tx = await liquidity.analyzeDeposits(1, [])
	console.log('analyze tx hash:', tx.hash)
	await tx.wait()

	await sleep(60)

	// relay
	tx = await liquidity.relayDeposits(1, 400_000, {
		value: ethers.parseEther('0.1'), // will be refunded automatically
	})
	console.log('relay tx hash:', tx.hash)
	await tx.wait()
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
