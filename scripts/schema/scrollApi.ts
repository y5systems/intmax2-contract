import { z } from 'zod'

const CounterpartChainTxSchema = z.object({
	hash: z.string(),
	block_number: z.number(),
})

const ProofSchema = z.object({
	batch_index: z.string(),
	merkle_proof: z.string(),
})

const ClaimInfoSchema = z.object({
	from: z.string(),
	to: z.string(),
	value: z.string(),
	nonce: z.string(),
	message: z.string(),
	proof: ProofSchema,
	claimable: z.boolean(),
})

const ResultSchema = z.object({
	hash: z.string(),
	replay_tx_hash: z.string().optional(),
	refund_tx_hash: z.string().optional(),
	message_hash: z.string(),
	token_type: z.number(),
	token_ids: z.array(z.unknown()),
	token_amounts: z.array(z.string()),
	message_type: z.number(),
	l1_token_address: z.string().optional(),
	l2_token_address: z.string().optional(),
	block_number: z.number(),
	tx_status: z.number(),
	counterpart_chain_tx: CounterpartChainTxSchema.optional(),
	claim_info: ClaimInfoSchema.nullable(),
	block_timestamp: z.number(),
	batch_deposit_fee: z.string().optional(),
})

export const ScrollApiResponseSchema = z.object({
	errcode: z.number(),
	errmsg: z.string(),
	data: z.object({
		results: z.array(ResultSchema),
		total: z.number(),
	}),
})

export type ScrollApiResponse = z.infer<typeof ScrollApiResponseSchema>
