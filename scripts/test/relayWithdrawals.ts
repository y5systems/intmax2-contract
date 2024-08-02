import { ethers } from 'hardhat'
import { readDeployedContracts } from '../utils/io'

async function main() {
	const deployedContracts = await readDeployedContracts()
	if (!deployedContracts.withdrawal) {
		throw new Error('withdrawal contracts should be deployed')
	}
	const withdrawal = await ethers.getContractAt(
		'Withdrawal',
		deployedContracts.withdrawal,
	)

	const lastDirectWithdrawalId = await withdrawal.getLastDirectWithdrawalId()
	const lastClaimableWithdrawalId =
		await withdrawal.getLastClaimableWithdrawalId()
	console.log('lastDirectWithdrawalId:', lastDirectWithdrawalId)
	console.log('lastClaimableWithdrawalId:', lastClaimableWithdrawalId)

	const tx = await withdrawal.relayWithdrawals(
		lastDirectWithdrawalId,
		lastClaimableWithdrawalId,
	)
	console.log('relayWithdrawals tx hash:', tx.hash)
	await tx.wait()
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
