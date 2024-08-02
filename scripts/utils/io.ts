import { z } from 'zod'
import {
	DeployedContracts,
	DeployedContractsSchema,
} from '../schema/deployedContractsSchema'
import fs from 'fs-extra'

const deployedContractPath = 'scripts/data/{networkName}-deployedContracts.json'

export async function readDeployedContracts(
	networkName: string,
): Promise<DeployedContracts> {
	const path = deployedContractPath.replace('{networkName}', networkName)
	try {
		const data = await fs.readJson(path)
		return DeployedContractsSchema.parse(data)
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('Validation error:', error.errors)
		} else {
			console.error('Error reading file:', error)
		}
		process.exit(1)
	}
}

export async function writeDeployedContracts(
	networkName: string,
	data: DeployedContracts,
): Promise<void> {
	const path = deployedContractPath.replace('{networkName}', networkName)
	try {
		const validatedUsers = DeployedContractsSchema.parse(data)
		await fs.writeJson(path, validatedUsers, { spaces: 4 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('Validation error:', error.errors)
		} else {
			console.error('Error writing file:', error)
		}
	}
}
