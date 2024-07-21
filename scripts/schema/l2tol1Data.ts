import { z } from 'zod'

const merkleProof = z.object({
	batchIndex: z.number().describe('Batch index'),
	merkleProof: z.string().describe('Merkle proof'),
})

export const L1toL2Data = z.object({
	messageNonce: z.number().describe('Message nonce'),
	message: z.string().describe('Message'),
	proof: merkleProof.describe('Proof'),
})

export type L1toL2Data = z.infer<typeof L1toL2Data>
