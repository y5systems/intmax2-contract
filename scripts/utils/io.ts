import { z } from 'zod'
import {
	DeployedContracts,
	DeployedContractsSchema,
} from '../schema/deployedContractsSchema'
import fs from 'fs-extra'
import { network } from 'hardhat'
import path from 'path'

const deployedContractPath = 'deployment-data/{networkName}-deployedContracts.json'

export async function readDeployedContracts(
	networkName: string = network.name,
): Promise<DeployedContracts> {
	const filePath = deployedContractPath.replace('{networkName}', networkName)
	try {
		const exists = await fs.pathExists(filePath)
		if (!exists) {
			await fs.ensureDir(path.dirname(filePath))
			await fs.writeJson(filePath, {}, { spaces: 2 })
			return {}
		}
		const data = await fs.readJson(filePath)
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
	data: DeployedContracts,
	networkName: string = network.name,
): Promise<void> {
	const filePath = deployedContractPath.replace('{networkName}', networkName)
	try {
		await fs.ensureDir(path.dirname(filePath))
		const validatedUsers = DeployedContractsSchema.parse(data)
		await fs.writeJson(filePath, validatedUsers, { spaces: 4 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('Validation error:', error.errors)
		} else {
			console.error('Error writing file:', error)
		}
	}
}
