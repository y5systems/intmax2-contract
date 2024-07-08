import { ethers } from 'hardhat'
import axios from 'axios'
import 'dotenv/config'
import { l2ContractAddress } from './contractAddresses.json'
import {
	ScrollMessengerResponse,
	ScrollMessengerResult,
} from './utils/scrollMessenger'

const l1MessengerAddress = '0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A'

async function main() {
	if (!l2ContractAddress) {
		throw new Error('l2ContractAddress is not set')
	}

	const baseUrl = 'https://sepolia-api-bridge-v2.scroll.io/api/l2/unclaimed'
	const page = 1
	const apiUrl = `${baseUrl}/withdrawals?address=${l2ContractAddress}&page_size=10&page=${page}`
	let results: ScrollMessengerResult[] = []
	try {
		const res = await axios.get<ScrollMessengerResponse>(apiUrl)
		if (res.data.data.results == null || res.data.data.results.length === 0) {
			console.error('no results')
			return
		}

		results = res.data.data.results
	} catch (error) {
		console.error('fail to get unclaimed messages', error)
		return
	}

	const owner = (await ethers.getSigners())[0].address
	console.log('owner address', owner)

	const scrollMessenger = await ethers.getContractAt(
		'IL1ScrollMessenger',
		l1MessengerAddress,
	)

	for (const result of results) {
		const { claim_info: claimInfo } = result
		if (!claimInfo?.claimable) {
			console.log('tx is not claimable')
			continue
		}

		const tx = await scrollMessenger.relayMessageWithProof(
			claimInfo.from,
			claimInfo.to,
			claimInfo.value,
			claimInfo.nonce,
			claimInfo.message,
			{
				batchIndex: claimInfo.proof.batch_index,
				merkleProof: claimInfo.proof.merkle_proof,
			},
		)

		console.log('tx hash:', tx.hash)
		await tx.wait()
		console.log('Send message from L2 to L1')
	}
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
