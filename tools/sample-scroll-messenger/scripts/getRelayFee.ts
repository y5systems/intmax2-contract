import { ethers } from 'hardhat'
import { getFee } from './utils/scrollMessenger'

const main = async () => {
	const gasLimit = 100000
	console.log('gasLimit:', gasLimit)
	const fee = await getFee(gasLimit)
	console.log('fee:', ethers.utils.formatEther(fee), 'ETH')
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
