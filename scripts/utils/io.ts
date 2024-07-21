import { z } from 'zod'
import {
	DeployedContracts,
	DeployedContractsSchema,
} from '../schema/deployedContractsSchema'
import fs from 'fs-extra'
import { L2ToL1Message } from '../schema/l2tol1Message'

const deployedContractPath = 'scripts/data/deployedContracts.json'
const l2ToL1MessagePath = 'scripts/data/l2ToL1Message.json'

export async function readDeployedContracts(): Promise<DeployedContracts> {
	try {
		const data = await fs.readJson(deployedContractPath)
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
		await fs.writeJson(deployedContractPath, validatedUsers, { spaces: 2 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('Validation error:', error.errors)
		} else {
			console.error('Error writing file:', error)
		}
	}
}

export async function readL2ToL1Message(): Promise<L2ToL1Message> {
	try {
		const data = await fs.readJson(l2ToL1MessagePath)
		return L2ToL1Message.parse(data)
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('Validation error:', error.errors)
		} else {
			console.error('Error reading file:', error)
		}
		process.exit(1)
	}
}
