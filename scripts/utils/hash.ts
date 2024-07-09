import { ethers } from 'ethers'

export const calcRecipientSaltHash = (recipient: string, salt: string) => {
	const recipientSaltHash = ethers.utils.solidityKeccak256(
		['address', 'bytes32'],
		[recipient, salt],
	) // TODO: Use Goldilocks Poseidon hash
	return recipientSaltHash
}
