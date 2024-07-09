import { ethers } from 'hardhat'
import 'dotenv/config'
import contractAddresses from './contractAddresses.json'
import { saveJsonToFile } from './utils/saveJsonToFile'

async function main() {
	const signers = await ethers.getSigners()
	const recipient = process.env.TOKEN_HOLDER || signers[0].address
	const tokenFactory = await ethers.getContractFactory('TestERC20')
	const token = await tokenFactory.deploy(recipient)
	await token.waitForDeployment()
	const tokenAddress = await token.getAddress()
	console.log('TestERC20 deployed to:', tokenAddress)

	const newContractAddresses = {
		...contractAddresses,
		testErc20: tokenAddress,
	}

	saveJsonToFile(
		'./scripts/contractAddresses.json',
		JSON.stringify(newContractAddresses, null, 2),
	)

	const balance = await token.balanceOf(recipient)
	const symbol = await token.symbol()
	console.log(`Mint ${balance.toString()} ${symbol} to ${recipient}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
