import { ethers, network } from 'hardhat'
import { readDeployedContracts } from './io'

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

export const getL1MessengerAddress = async () => {
	if (network.name === 'sepolia') {
		const deployedContracts = await readDeployedContracts()
		if (!deployedContracts.mockL1ScrollMessenger) {
			return '0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A' // real address
		} else {
			return deployedContracts.mockL1ScrollMessenger
		}
	}
	if (network.name === 'localhost') {
		// provisional measures
		return ethers.ZeroAddress
	}
	//TODO mainnet messenger address
	throw new Error('Unsupported network')
}

export const getL2MessengerAddress = async () => {
	if (network.name === 'scrollSepolia') {
		const deployedContracts = await readDeployedContracts()
		if (!deployedContracts.mockL2ScrollMessenger) {
			return '0xBa50f5340FB9F3Bd074bD638c9BE13eCB36E603d' // real address
		} else {
			return deployedContracts.mockL2ScrollMessenger // mock address
		}
	}
	if (network.name === 'localhost') {
		// provisional measures
		return ethers.ZeroAddress
	}

	//TODO scroll messenger address
	throw new Error('Unsupported network')
}
