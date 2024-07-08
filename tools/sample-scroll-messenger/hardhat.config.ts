import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'dotenv/config'

const { PRIVATE_KEY, ALCHEMY_KEY } = process.env
// if (!process.env.PRIVATE_KEY) {
//   throw new Error("PRIVATE_KEY is not set");
// }

// if (!ALCHEMY_KEY) {
//   throw new Error("ALCHEMY_KEY is not set");
// }

const config: HardhatUserConfig = {
	solidity: '0.8.20',
	networks: {
		sepolia: {
			// url: "https://1rpc.io/sepolia",
			url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY || ''}`,
			accounts: [PRIVATE_KEY || ''],
		},
		arbitrum: {
			url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY || ''}`,
			accounts: [PRIVATE_KEY || ''],
		},
		scrollsepolia: {
			url: 'https://scroll-testnet.rpc.grove.city/v1/a7a7c8e2',
			accounts: [PRIVATE_KEY || ''],
		},
		scroll: {
			url: 'https://scroll.drpc.org',
			accounts: [PRIVATE_KEY || ''],
		},
	},
}

export default config
