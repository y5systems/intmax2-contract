import { z } from 'zod'

const merkleProof = z.object({
	batchIndex: z.number().describe('Batch index'),
	merkleProof: z.string().describe('Merkle proof'),
})

export const L2ToL1Message = z.object({
	messageNonce: z.number().describe('Message nonce'),
	message: z.string().describe('Message'),
	proof: merkleProof.describe('Proof'),
})

export type L2ToL1Message = z.infer<typeof L2ToL1Message>
