import { ethers, network } from 'hardhat'

if (network.name !== 'sepolia') {
	throw new Error('This script should be run on sepolia network')
}

async function main() {
    console.log('deploying testErc20')
    const TestERC20 = await ethers.getContractFactory('TestERC20')
    const owner = (await ethers.getSigners())[0]
    const testErc20 = await TestERC20.deploy(owner.address)
    console.log("Test ERC20 deployed to:", await testErc20.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
