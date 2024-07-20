import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@openzeppelin/hardhat-upgrades'
import 'dotenv/config'
import { cleanEnv, str } from 'envalid'

const env = cleanEnv(process.env, {
	PRIVATE_KEY: str(),
	ALCHEMY_KEY: str(),
})

const config: HardhatUserConfig = {
	solidity: '0.8.24',
	networks: {
		sepolia: {
			// url: "https://1rpc.io/sepolia",
			url: `https://eth-sepolia.g.alchemy.com/v2/${env.ALCHEMY_KEY}`,
			accounts: [env.PRIVATE_KEY],
		},
		arbitrum: {
			url: `https://arb-mainnet.g.alchemy.com/v2/${env.ALCHEMY_KEY}`,
			accounts: [env.PRIVATE_KEY],
		},
		scrollsepolia: {
			url: 'https://scroll-testnet.rpc.grove.city/v1/a7a7c8e2',
			accounts: [env.PRIVATE_KEY],
		},
	},
}

export default config
