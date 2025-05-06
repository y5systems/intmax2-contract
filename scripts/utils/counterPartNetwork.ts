import { network } from 'hardhat'

export function getCounterPartNetwork(): string {
	if (network.name === 'localhost') {
		return 'localhost'
	}
	if (network.name === 'holesky') {
		return 'holesky'
	}
	if (network.name === 'sepolia') {
		return 'scrollSepolia'
	}
	if (network.name === 'scrollSepolia') {
		return 'baseSepolia'
	}
	if (network.name === 'mainnet') {
		return 'scroll'
	}
	if (network.name === 'scroll') {
		return 'mainnet'
	}
	if (network.name === 'baseSepolia') {
		return 'scrollSepolia'
	}
	throw new Error('unknown network')
}
