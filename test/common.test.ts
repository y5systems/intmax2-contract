import { ethers } from 'hardhat'

export const getDepositHash = (
	depositId: number,
	recipientSaltHash: string,
	tokenIndex: number,
	amount: bigint,
): string => {
	const packed = ethers.solidityPacked(
		['uint32', 'bytes32', 'uint32', 'uint256'],
		[depositId, recipientSaltHash, tokenIndex, amount],
	)
	const hash = ethers.keccak256(packed)
	return hash
}
