import { ethers } from 'hardhat'

import { type ChainedClaimLib } from '../../typechain-types/contracts/claim/lib/ChainedClaimLib'

export const getChainedWithdrawals = (
	count: number,
): ChainedWithdrawalLib.ChainedWithdrawalStruct[] => {
	return Array.from({ length: count }, (_, i) => getChainedWithdrawal(i))
}

const getChainedClaim = (
	num: number,
): ChainedWithdrawalLib.ChainedWithdrawalStruct => {
	return {
		recipient: ethers.Wallet.createRandom().address,
		tokenIndex: num,
		amount: ethers.parseEther(String(num)),
		nullifier: ethers.randomBytes(32),
		blockHash: ethers.randomBytes(32),
		blockNumber: Math.floor(Math.random() * 100000000),
	}
}

export const getPrevHashFromWithdrawals = (
	withdrawals: ChainedWithdrawalLib.ChainedWithdrawalStruct[],
): string => {
	let prevHash = ethers.ZeroHash
	for (const withdrawal of withdrawals) {
		prevHash = ethers.keccak256(
			ethers.solidityPacked(
				[
					'bytes32',
					'address',
					'uint32',
					'uint256',
					'bytes32',
					'bytes32',
					'uint32',
				],
				[
					prevHash,
					withdrawal.recipient,
					withdrawal.tokenIndex,
					withdrawal.amount,
					withdrawal.nullifier,
					withdrawal.blockHash,
					withdrawal.blockNumber,
				],
			),
		)
	}
	return prevHash
}
