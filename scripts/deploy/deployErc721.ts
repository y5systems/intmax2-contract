import { ethers, network } from 'hardhat'

if (network.name !== 'sepolia') {
	throw new Error('This script should be run on sepolia network')
}

async function main() {
	console.log('deploying testErc20')
	const TestERC721 = await ethers.getContractFactory('TestNFT')
	const owner = (await ethers.getSigners())[0]
	const testErc20 = await TestERC721.deploy()
	console.log('Test ERC721 deployed to:', await testErc20.getAddress())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
