interface WithdrawalInfo {
	withdrawals: Withdrawal[]
	withdrawalProofPublicInputs: WithdrawalProofPublicInputs
	pisHash: string
}

interface Withdrawal {
	recipient: string
	tokenIndex: number
	amount: string
	nullifier: string
	blockHash: string
	blockNumber: number
}

interface WithdrawalProofPublicInputs {
	lastWithdrawalHash: string
	withdrawalAggregator: string
}
