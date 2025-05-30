import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import '@openzeppelin/hardhat-upgrades'
import 'dotenv/config'
import { cleanEnv, str } from 'envalid'
import 'solidity-docgen'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

const env = cleanEnv(process.env, {
	DEPLOYER_PRIVATE_KEY: str(),
	ALCHEMY_KEY: str(),
	ETHERSCAN_API_KEY: str(),
	SCROLLSCAN_API_KEY: str(),
	INFURA_KEY: str(),
	BASESCAN_API_KEY: str(),
})

const accounts = [env.DEPLOYER_PRIVATE_KEY]

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.27',
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
			viaIR: true,
		},
	},
	gasReporter: {
		enabled: true,
		currency: 'USD',
	},
	networks: {
		mainnet: {
			url: `https://eth-mainnet.g.alchemy.com/v2/${env.ALCHEMY_KEY}`,
			accounts,
		},
		scroll: {
			url: `https://scroll-mainnet.g.alchemy.com/v2/${env.ALCHEMY_KEY}`,
			accounts,
		},
		sepolia: {
			url: `https://eth-sepolia.g.alchemy.com/v2/${env.ALCHEMY_KEY}`,
			accounts,
		},
		scrollSepolia: {
			url: `https://scroll-sepolia.infura.io/v3/${env.INFURA_KEY}`,
			accounts,
		},
		holesky: {
			url: `https://eth-holesky.g.alchemy.com/v2/${env.ALCHEMY_KEY}`,
			accounts,
		},
		baseSepolia: {
			url: `https://base-sepolia.infura.io/v3/${env.INFURA_KEY}`,
			accounts,
		},
	},
	docgen: {
		exclude: ['test'],
	},
	etherscan: {
		apiKey: {
			mainnet: env.ETHERSCAN_API_KEY,
			sepolia: env.ETHERSCAN_API_KEY,
			scroll: env.SCROLLSCAN_API_KEY,
			scrollSepolia: env.SCROLLSCAN_API_KEY,
			baseSepolia: env.BASESCAN_API_KEY,
		},
		customChains: [
			{
				network: 'scroll',
				chainId: 534352,
				urls: {
					apiURL: 'https://api.scrollscan.com/api',
					browserURL: 'https://scrollscan.com/',
				},
			},
			{
				network: 'scrollSepolia',
				chainId: 534351,
				urls: {
					apiURL: 'https://api-sepolia.scrollscan.com/api',
					browserURL: 'https://sepolia.scrollscan.com/',
				},
			},
			{
				network: 'baseSepolia',
				chainId: 84532,
				urls: {
					apiURL: 'https://api-sepolia.basescan.org/api',
					browserURL: 'https://sepolia.basescan.org/',
				},
			},
		],
	},
	sourcify: {
		enabled: false,
	},
}

export default config
