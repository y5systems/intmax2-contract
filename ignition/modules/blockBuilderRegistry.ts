import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import rollupModule from './rollup'

const poxyModule = buildModule('proxyModule', (m) => {
	const blockBuilderRegistry = m.contract('BlockBuilderRegistry')
	const { rollup } = m.useModule(rollupModule)
	const data = m.encodeFunctionCall(blockBuilderRegistry, 'initialize', [
		rollup.address,
	])
	const proxy = m.contract('ERC1967Proxy', [blockBuilderRegistry, data])
	return {
		proxy,
	}
})

const blockBuilderRegistryModule = buildModule(
	'blockBuilderRegistryModule',
	(m) => {
		const { proxy } = m.useModule(poxyModule)
		const blockBuilderRegistry = m.contractAt('BlockBuilderRegistry', proxy)
		return { blockBuilderRegistry }
	},
)

export default blockBuilderRegistryModule
