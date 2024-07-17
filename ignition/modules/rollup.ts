import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { ethers } from 'hardhat'

const rollupProxyModule = buildModule('rollupProxyModule', (m) => {
	const rollup = m.contract('Rollup')
	const proxy = m.contract('ERC1967Proxy', [rollup, '0x'])
	return {
		proxy,
	}
})

const rollupModule = buildModule('rollupModule', (m) => {
	const { proxy } = m.useModule(rollupProxyModule)
	const rollup = m.contractAt('Rollup', proxy)
	const zero = ethers.ZeroAddress
	m.call(rollup, 'initialize', [zero, zero, zero, zero])
	return { rollup }
})

export default rollupModule
