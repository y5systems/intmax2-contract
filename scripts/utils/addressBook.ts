import { ethers, network } from 'hardhat'

export const getL1MessengerAddress = () => {
	if (network.name === 'sepolia') {
		return '0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A'
	}
	if (network.name === 'localhost') {
		// provisional measures
		return ethers.ZeroAddress
	}
	//TODO mainnet messenger address
	throw new Error('Unsupported network')
}

export const getUSDCAddress = () => {
	if (network.name === 'sepolia') {
		return '0xf08A50178dfcDe18524640EA6618a1f965821715'
	}
	if (network.name === 'localhost') {
		// provisional measures
		return '0x0000000000000000000000000000000000000001'
	}
	//TODO mainnet usdc address
	throw new Error('Unsupported network')
}

export const getWBTCAddress = () => {
	if (network.name === 'sepolia') {
		return '0x92f3B59a79bFf5dc60c0d59eA13a44D082B2bdFC'
	}
	if (network.name === 'localhost') {
		// provisional measures
		return '0x0000000000000000000000000000000000000002'
	}
	//TODO mainnet usdc address
	throw new Error('Unsupported network')
}

export const getL2MessengerAddress = () => {
	if (network.name === 'scrollSepolia') {
		return '0xBa50f5340FB9F3Bd074bD638c9BE13eCB36E603d'
	}
	if (network.name === 'localhost') {
		// provisional measures
		return ethers.ZeroAddress
	}

	//TODO scroll messenger address
	throw new Error('Unsupported network')
}
