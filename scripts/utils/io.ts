import { z } from 'zod'
import {
	DeployedContracts,
	DeployedContractsSchema,
} from '../schema/deployedContractsSchema'
import fs from 'fs-extra'
import { L1toL2Data } from '../schema/l2tol1Data'

const deployedContractPath = 'scripts/data/deployedContracts.json'
const l1ToL2DataPath = 'scripts/data/l1ToL2Data.json'

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

export async function readL1ToL2Data(): Promise<L1toL2Data> {
	try {
		const data = await fs.readJson(l1ToL2DataPath)
		return L1toL2Data.parse(data)
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('Validation error:', error.errors)
		} else {
			console.error('Error reading file:', error)
		}
		process.exit(1)
	}
}
