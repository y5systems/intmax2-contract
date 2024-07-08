import { ethers } from 'hardhat'
import 'dotenv/config'
import { l2ContractAddress } from './contractAddresses.json'

async function main() {
	if (!l2ContractAddress) {
		throw new Error('l2ContractAddress is not set')
	}

	const owner = (await ethers.getSigners())[0].address
	console.log('owner address', owner)

	const rollup = await ethers.getContractAt('L2Contract', l2ContractAddress)

	const greeting = 'https://l2.example.com'
	const fee = ethers.utils.parseEther('0')
	const tx = await rollup.sendMessageToL1(greeting, {
		value: fee,
	})
	console.log('tx hash:', tx.hash)
	await tx.wait()
	console.log('Send message from L2 to L1')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
