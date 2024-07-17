import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { ethers } from 'hardhat'

const proxyModule = buildModule('ProxyModule', (m) => {
	const rollup = m.contract('Rollup')
	const proxy = m.contract('ERC1967Proxy', [rollup, '0x'])
	return {
		proxy,
	}
})

const testRollupModule = buildModule('TestRollupModule', (m) => {
	const { proxy } = m.useModule(proxyModule)
	const rollup = m.contractAt('Rollup', proxy)
	const zero = ethers.ZeroAddress
	m.call(rollup, 'initialize', [zero, zero, zero, zero])
	return { rollup }
})

export default testRollupModule
