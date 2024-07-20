import { z } from 'zod'
import {
	DeployedContracts,
	DeployedContractsSchema,
} from '../schema/deployedContractsSchema'
import fs from 'fs-extra'

const filePath = 'scripts/deployedContracts.json'

export async function readDeployedContracts(): Promise<DeployedContracts> {
	try {
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
): Promise<void> {
	try {
		const validatedUsers = DeployedContractsSchema.parse(data)
		await fs.writeJson(filePath, validatedUsers, { spaces: 2 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('Validation error:', error.errors)
		} else {
			console.error('Error writing file:', error)
		}
	}
}
