import { ethers } from 'hardhat'
import 'dotenv/config'
import { l1ContractAddress, l2ContractAddress } from './contractAddresses.json'

async function main() {
	if (!l1ContractAddress) {
		throw new Error('l1ContractAddress is not set')
	}

	if (!l2ContractAddress) {
		throw new Error('l2ContractAddress is not set')
	}

	const owner = (await ethers.getSigners())[0].address
	console.log('owner address', owner)

	const l1Contract = await ethers.getContractAt('L1Contract', l1ContractAddress)

	const tx = await l1Contract.updateRollupContract(l2ContractAddress)
	console.log('tx hash:', tx.hash)
	await tx.wait()
	console.log('Updated l2 contract address')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
