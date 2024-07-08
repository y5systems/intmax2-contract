import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'dotenv/config'

const privateKey =
	process.env.PRIVATE_KEY ||
	'0000000000000000000000000000000000000000000000000000000000000000'
const alchemyKey = process.env.ALCHEMY_KEY || ''

const config: HardhatUserConfig = {
	solidity: '0.8.20',
	networks: {
		sepolia: {
			// url: "https://1rpc.io/sepolia",
			url: `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`,
			accounts: [privateKey],
		},
		arbitrum: {
			url: `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`,
			accounts: [privateKey],
		},
		scrollsepolia: {
			url: 'https://scroll-testnet.rpc.grove.city/v1/a7a7c8e2',
			accounts: [privateKey],
		},
	},
}

export default config
