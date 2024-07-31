import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import {
	Withdrawal,
	L2ScrollMessengerTestForWithdrawal,
	MockPlonkVerifier,
	RollupTestForWithdrawal,
} from '../../typechain-types'
import {
	getPrevHashFromWithdrawals,
	getChainedWithdrawals,
} from './common.test'

describe('Withdrawal', () => {
	const DIRECT_WITHDRAWAL_TOKEN_INDICES = [1, 2, 3]
	const MAX_RELAY_DIRECT_WITHDRAWALS = 20
	const MAX_RELAY_CLAIMABLE_WITHDRAWALS = 100
	const UINT256_MAX =
		'115792089237316195423570985008687907853269984665640564039457584007913129639935'
	async function setup(): Promise<
		[
			Withdrawal,
			L2ScrollMessengerTestForWithdrawal,
			MockPlonkVerifier,
			RollupTestForWithdrawal,
			string,
		]
	> {
		const l2ScrollMessengerFactory = await ethers.getContractFactory(
			'L2ScrollMessengerTestForWithdrawal',
		)
		const l2ScrollMessenger = await l2ScrollMessengerFactory.deploy()
		const mockPlonkVerifierFactory =
			await ethers.getContractFactory('MockPlonkVerifier')
		const mockPlonkVerifier = await mockPlonkVerifierFactory.deploy()
		const rollupTestForWithdrawalFactory = await ethers.getContractFactory(
			'RollupTestForWithdrawal',
		)
		const rollupTestForWithdrawal =
			await rollupTestForWithdrawalFactory.deploy()
		const liquidity = ethers.Wallet.createRandom().address
		const withdrawalFactory = await ethers.getContractFactory('Withdrawal')
		const withdrawal = (await upgrades.deployProxy(
			withdrawalFactory,
			[
				await l2ScrollMessenger.getAddress(),
				await mockPlonkVerifier.getAddress(),
				liquidity,
				await rollupTestForWithdrawal.getAddress(),
				DIRECT_WITHDRAWAL_TOKEN_INDICES,
			],
			{ kind: 'uups' },
		)) as unknown as Withdrawal
		return [
			withdrawal,
			l2ScrollMessenger,
			mockPlonkVerifier,
			rollupTestForWithdrawal,
			liquidity,
		]
	}
	type signers = {
		deployer: HardhatEthersSigner
		user: HardhatEthersSigner
	}
	const getSigners = async (): Promise<signers> => {
		const [deployer, user] = await ethers.getSigners()
		return {
			deployer,
			user,
		}
	}
	describe('initialize', () => {
		describe('success', () => {
			it('should set deployer as the owner', async () => {
				const [withdrawal] = await loadFixture(setup)
				const signers = await getSigners()
				expect(await withdrawal.owner()).to.equal(signers.deployer.address)
			})
		})
		describe('fail', () => {
			it('should revert when initializing twice', async () => {
				const [withdrawal] = await loadFixture(setup)

				await expect(
					withdrawal.initialize(
						ethers.ZeroAddress,
						ethers.ZeroAddress,
						ethers.ZeroAddress,
						ethers.ZeroAddress,
						[0, 1],
					),
				).to.be.revertedWithCustomError(withdrawal, 'InvalidInitialization')
			})
		})
	})
	describe('submitWithdrawalProof', () => {
		describe('success', () => {
			it('should accept valid withdrawal proof and queue direct withdrawals', async () => {
				const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				// Create withdrawals for direct withdrawal tokens
				const directWithdrawals = getChainedWithdrawals(2).map((w) => ({
					...w,
					tokenIndex: DIRECT_WITHDRAWAL_TOKEN_INDICES[0], // Use a direct withdrawal token index
				}))
				const lastWithdrawalHash = getPrevHashFromWithdrawals(directWithdrawals)

				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				// Set up mock responses
				await mockPlonkVerifier.setResult(true)
				for (const w of directWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				// Submit the withdrawal proof
				await expect(
					withdrawal.submitWithdrawalProof(
						directWithdrawals,
						validPublicInputs,
						'0x',
					),
				)
					.to.emit(withdrawal, 'DirectWithdrawalQueued')
					.withArgs(1, [
						directWithdrawals[0].recipient,
						directWithdrawals[0].tokenIndex,
						directWithdrawals[0].amount,
						1,
					])
					.and.to.emit(withdrawal, 'DirectWithdrawalQueued')
					.withArgs(2, [
						directWithdrawals[1].recipient,
						directWithdrawals[1].tokenIndex,
						directWithdrawals[1].amount,
						2,
					])
					.and.to.emit(withdrawal, 'WithdrawalsQueued')
					.withArgs(2, 0)

				// Verify that the withdrawals were queued
				expect(await withdrawal.getLastDirectWithdrawalId()).to.equal(2)
				expect(await withdrawal.getLastClaimableWithdrawalId()).to.equal(0)
			})
			it('should accept valid withdrawal proof and queue claimable withdrawals', async () => {
				const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				// Create withdrawals for non-direct withdrawal tokens
				const claimableWithdrawals = getChainedWithdrawals(2).map((w) => ({
					...w,
					tokenIndex: 1000, // Use a non-direct withdrawal token index
				}))
				const lastWithdrawalHash =
					getPrevHashFromWithdrawals(claimableWithdrawals)

				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				// Set up mock responses
				await mockPlonkVerifier.setResult(true)
				for (const w of claimableWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				// Submit the withdrawal proof
				await expect(
					withdrawal.submitWithdrawalProof(
						claimableWithdrawals,
						validPublicInputs,
						'0x',
					),
				)
					.to.emit(withdrawal, 'ClaimableWithdrawalQueued')
					.withArgs(1, [
						claimableWithdrawals[0].recipient,
						claimableWithdrawals[0].tokenIndex,
						claimableWithdrawals[0].amount,
						1,
					])
					.and.to.emit(withdrawal, 'ClaimableWithdrawalQueued')
					.withArgs(2, [
						claimableWithdrawals[1].recipient,
						claimableWithdrawals[1].tokenIndex,
						claimableWithdrawals[1].amount,
						2,
					])
					.and.to.emit(withdrawal, 'WithdrawalsQueued')
					.withArgs(0, 2)

				// Verify that the withdrawals were queued
				expect(await withdrawal.getLastDirectWithdrawalId()).to.equal(0)
				expect(await withdrawal.getLastClaimableWithdrawalId()).to.equal(2)
			})
			it('should handle mixed direct and claimable withdrawals', async () => {
				const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				const mixedWithdrawals = [
					{
						...getChainedWithdrawals(1)[0],
						tokenIndex: DIRECT_WITHDRAWAL_TOKEN_INDICES[0],
						blockNumber: 1000,
					},
					{
						...getChainedWithdrawals(1)[0],
						tokenIndex: 1000,
						blockNumber: 2000,
					},
				]
				const lastWithdrawalHash = getPrevHashFromWithdrawals(mixedWithdrawals)

				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)

				for (const w of mixedWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				await expect(
					withdrawal.submitWithdrawalProof(
						mixedWithdrawals,
						validPublicInputs,
						'0x',
					),
				)
					.to.emit(withdrawal, 'DirectWithdrawalQueued')
					.and.to.emit(withdrawal, 'ClaimableWithdrawalQueued')
					.and.to.emit(withdrawal, 'WithdrawalsQueued')

				expect(await withdrawal.getLastDirectWithdrawalId()).to.equal(1)
				expect(await withdrawal.getLastClaimableWithdrawalId()).to.equal(1)
			})
			it('should emit DirectWithdrawalQueued event for direct withdrawals', async () => {
				const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				const directWithdrawal = {
					...getChainedWithdrawals(1)[0],
					tokenIndex: DIRECT_WITHDRAWAL_TOKEN_INDICES[0],
				}
				const lastWithdrawalHash = getPrevHashFromWithdrawals([
					directWithdrawal,
				])

				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				await rollupTestForWithdrawal.setTestData(
					directWithdrawal.blockNumber,
					directWithdrawal.blockHash,
				)

				await expect(
					withdrawal.submitWithdrawalProof(
						[directWithdrawal],
						validPublicInputs,
						'0x',
					),
				)
					.to.emit(withdrawal, 'DirectWithdrawalQueued')
					.withArgs(1, [
						directWithdrawal.recipient,
						directWithdrawal.tokenIndex,
						directWithdrawal.amount,
						1,
					])
			})
			it('should emit ClaimableWithdrawalQueued event for claimable withdrawals', async () => {
				const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				const claimableWithdrawal = {
					...getChainedWithdrawals(1)[0],
					tokenIndex: 1000,
				}
				const lastWithdrawalHash = getPrevHashFromWithdrawals([
					claimableWithdrawal,
				])

				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				await rollupTestForWithdrawal.setTestData(
					claimableWithdrawal.blockNumber,
					claimableWithdrawal.blockHash,
				)

				await expect(
					withdrawal.submitWithdrawalProof(
						[claimableWithdrawal],
						validPublicInputs,
						'0x',
					),
				)
					.to.emit(withdrawal, 'ClaimableWithdrawalQueued')
					.withArgs(1, [
						claimableWithdrawal.recipient,
						claimableWithdrawal.tokenIndex,
						claimableWithdrawal.amount,
						1,
					])
			})
			it('should emit WithdrawalsQueued event', async () => {
				const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				const mixedWithdrawals = [
					{
						...getChainedWithdrawals(1)[0],
						tokenIndex: DIRECT_WITHDRAWAL_TOKEN_INDICES[0],
						blockNumber: 1000,
					},
					{
						...getChainedWithdrawals(1)[0],
						tokenIndex: 1000,
						blockNumber: 2000,
					},
				]
				const lastWithdrawalHash = getPrevHashFromWithdrawals(mixedWithdrawals)

				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				for (const w of mixedWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				await expect(
					withdrawal.submitWithdrawalProof(
						mixedWithdrawals,
						validPublicInputs,
						'0x',
					),
				)
					.to.emit(withdrawal, 'WithdrawalsQueued')
					.withArgs(1, 1)
			})
			it('should not requeue already processed withdrawals (nullifier check)', async () => {
				const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				const singleWithdrawal = getChainedWithdrawals(1)[0]
				const lastWithdrawalHash = getPrevHashFromWithdrawals([
					singleWithdrawal,
				])

				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				await rollupTestForWithdrawal.setTestData(
					singleWithdrawal.blockNumber,
					singleWithdrawal.blockHash,
				)

				// First submission
				await withdrawal.submitWithdrawalProof(
					[singleWithdrawal],
					validPublicInputs,
					'0x',
				)

				// Second submission with the same withdrawal
				await expect(
					withdrawal.submitWithdrawalProof(
						[singleWithdrawal],
						validPublicInputs,
						'0x',
					),
				)
					.to.not.emit(withdrawal, 'DirectWithdrawalQueued')
					.and.to.not.emit(withdrawal, 'ClaimableWithdrawalQueued')

				// Check that the withdrawal IDs haven't changed
				expect(await withdrawal.getLastDirectWithdrawalId()).to.equal(
					singleWithdrawal.tokenIndex === DIRECT_WITHDRAWAL_TOKEN_INDICES[0]
						? 1
						: 0,
				)
				expect(await withdrawal.getLastClaimableWithdrawalId()).to.equal(
					singleWithdrawal.tokenIndex === DIRECT_WITHDRAWAL_TOKEN_INDICES[0]
						? 0
						: 1,
				)
			})
		})

		describe('fail', () => {
			it.only('only owner', async () => {
				const [withdrawal] = await loadFixture(setup)
				const { deployer, user } = await getSigners()

				const invalidWithdrawals = getChainedWithdrawals(1)

				const invalidPublicInputs = {
					lastWithdrawalHash: ethers.randomBytes(32),
					withdrawalAggregator: deployer.address,
				}

				await expect(
					withdrawal
						.connect(user)
						.submitWithdrawalProof(
							invalidWithdrawals,
							invalidPublicInputs,
							'0x',
						),
				)
					.to.be.revertedWithCustomError(
						withdrawal,
						'OwnableUnauthorizedAccount',
					)
					.withArgs(user.address)
			})
			it('should revert when withdrawal chain verification fails', async () => {
				const [withdrawal] = await loadFixture(setup)
				const { deployer } = await getSigners()

				const invalidWithdrawals = getChainedWithdrawals(1)

				const invalidPublicInputs = {
					lastWithdrawalHash: ethers.randomBytes(32),
					withdrawalAggregator: deployer.address,
				}

				await expect(
					withdrawal.submitWithdrawalProof(
						invalidWithdrawals,
						invalidPublicInputs,
						'0x',
					),
				).to.be.revertedWithCustomError(
					withdrawal,
					'WithdrawalChainVerificationFailed',
				)
			})

			it('should revert when withdrawal aggregator does not match msg.sender', async () => {
				const [withdrawal] = await loadFixture(setup)

				const validWithdrawals = getChainedWithdrawals(1)
				const lastWithdrawalHash = getPrevHashFromWithdrawals(validWithdrawals)
				const invalidPublicInputs = {
					lastWithdrawalHash: lastWithdrawalHash,
					withdrawalAggregator: ethers.Wallet.createRandom().address, // Different from msg.sender
				}

				await expect(
					withdrawal.submitWithdrawalProof(
						validWithdrawals,
						invalidPublicInputs,
						'0x',
					),
				).to.be.revertedWithCustomError(
					withdrawal,
					'WithdrawalAggregatorMismatch',
				)
			})

			it('should revert when withdrawal proof verification fails', async () => {
				const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				// Set MockPlonkVerifier to return false
				await mockPlonkVerifier.setResult(false)

				const validWithdrawals = getChainedWithdrawals(1)
				const lastWithdrawalHash = getPrevHashFromWithdrawals(validWithdrawals)

				const validPublicInputs = {
					lastWithdrawalHash: lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await expect(
					withdrawal.submitWithdrawalProof(
						validWithdrawals,
						validPublicInputs,
						'0x',
					),
				).to.be.revertedWithCustomError(
					withdrawal,
					'WithdrawalProofVerificationFailed',
				)
			})

			it('should revert when block hash does not exist', async () => {
				const [withdrawal, , , rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				//const invalidBlockHash = ethers.randomBytes(32)
				const blockNumber = 1

				const withdrawals = getChainedWithdrawals(1)

				const validPublicInputs = {
					lastWithdrawalHash: getPrevHashFromWithdrawals(withdrawals),
					withdrawalAggregator: deployer.address,
				}

				// Set a different block hash in the RollupTestForWithdrawal contract
				await rollupTestForWithdrawal.setTestData(blockNumber, ethers.ZeroHash)

				await expect(
					withdrawal.submitWithdrawalProof(
						withdrawals,
						validPublicInputs,
						'0x',
					),
				).to.be.revertedWithCustomError(withdrawal, 'BlockHashNotExists')
				expect(withdrawals[0].blockHash).to.not.equal(ethers.ZeroHash)
			})
		})
	})
	describe('relayWithdrawals', () => {
		describe('success', () => {
			it('should relay direct withdrawals', async () => {
				const [
					withdrawal,
					l2ScrollMessenger,
					mockPlonkVerifier,
					rollupTestForWithdrawal,
					liquidity,
				] = await loadFixture(setup)
				const { deployer } = await getSigners()

				// Create and submit direct withdrawals
				const directWithdrawalsCount = 10
				const directWithdrawals = getChainedWithdrawals(
					directWithdrawalsCount,
				).map((w) => ({
					...w,
					tokenIndex: DIRECT_WITHDRAWAL_TOKEN_INDICES[0],
				}))

				const lastWithdrawalHash = getPrevHashFromWithdrawals(directWithdrawals)
				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				for (const w of directWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				// Submit the withdrawals
				await withdrawal.submitWithdrawalProof(
					directWithdrawals,
					validPublicInputs,
					'0x',
				)

				// Relay withdrawals up to a specific ID
				const relayUpToId = 5n
				await withdrawal.relayWithdrawals(relayUpToId, 0)

				// Check that the correct number of withdrawals were relayed
				expect(await withdrawal.getLastRelayedDirectWithdrawalId()).to.equal(
					relayUpToId - 1n,
				)

				expect(await l2ScrollMessenger.to()).to.equal(liquidity)
				expect(await l2ScrollMessenger.value()).to.equal(0)
				expect((await l2ScrollMessenger.message()).length).to.equal(1418)
				expect(await l2ScrollMessenger.gasLimit()).to.equal(UINT256_MAX)
				expect(await l2ScrollMessenger.sender()).to.equal(deployer.address)
				expect(await l2ScrollMessenger.msgValue()).to.equal(0)
			})

			it('should relay claimable withdrawals', async () => {
				const [
					withdrawal,
					l2ScrollMessenger,
					mockPlonkVerifier,
					rollupTestForWithdrawal,
					liquidity,
				] = await loadFixture(setup)
				const { deployer } = await getSigners()

				// Create and submit claimable withdrawals
				const claimableWithdrawalsCount = 10
				const claimableWithdrawals = getChainedWithdrawals(
					claimableWithdrawalsCount,
				).map((w) => ({
					...w,
					tokenIndex: 1000, // Non-direct withdrawal token index
				}))

				const lastWithdrawalHash =
					getPrevHashFromWithdrawals(claimableWithdrawals)
				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				for (const w of claimableWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				// Submit the withdrawals
				await withdrawal.submitWithdrawalProof(
					claimableWithdrawals,
					validPublicInputs,
					'0x',
				)

				// Relay withdrawals up to a specific ID
				const relayUpToId = 5n
				await withdrawal.relayWithdrawals(0, relayUpToId)

				// Check that the correct number of withdrawals were relayed
				expect(await withdrawal.getLastRelayedClaimableWithdrawalId()).to.equal(
					relayUpToId - 1n,
				)

				// Verify the L2ScrollMessenger interaction
				expect(await l2ScrollMessenger.to()).to.equal(liquidity)
				expect(await l2ScrollMessenger.value()).to.equal(0)
				expect((await l2ScrollMessenger.message()).length).to.equal(650)
				expect(await l2ScrollMessenger.gasLimit()).to.equal(UINT256_MAX)
				expect(await l2ScrollMessenger.sender()).to.equal(deployer.address)
				expect(await l2ScrollMessenger.msgValue()).to.equal(0)
			})

			it('should relay both direct and claimable withdrawals', async () => {
				const [
					withdrawal,
					l2ScrollMessenger,
					mockPlonkVerifier,
					rollupTestForWithdrawal,
					liquidity,
				] = await loadFixture(setup)
				const { deployer } = await getSigners()

				// Create and submit direct withdrawals
				const directWithdrawalsCount = 5
				const directWithdrawals = getChainedWithdrawals(
					directWithdrawalsCount,
				).map((w) => ({
					...w,
					tokenIndex: DIRECT_WITHDRAWAL_TOKEN_INDICES[0],
				}))

				// Create and submit claimable withdrawals
				const claimableWithdrawalsCount = 5
				const claimableWithdrawals = getChainedWithdrawals(
					claimableWithdrawalsCount,
				).map((w) => ({
					...w,
					tokenIndex: 1000, // Non-direct withdrawal token index
				}))

				const allWithdrawals = [...directWithdrawals, ...claimableWithdrawals]
				const lastWithdrawalHash = getPrevHashFromWithdrawals(allWithdrawals)
				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				for (const w of allWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				// Submit all withdrawals
				await withdrawal.submitWithdrawalProof(
					allWithdrawals,
					validPublicInputs,
					'0x',
				)

				// Relay both direct and claimable withdrawals
				const relayDirectUpToId = 4n
				const relayClaimableUpToId = 3n
				await withdrawal.relayWithdrawals(
					relayDirectUpToId,
					relayClaimableUpToId,
				)

				// Check that the correct number of withdrawals were relayed
				expect(await withdrawal.getLastRelayedDirectWithdrawalId()).to.equal(
					relayDirectUpToId - 1n,
				)
				expect(await withdrawal.getLastRelayedClaimableWithdrawalId()).to.equal(
					relayClaimableUpToId - 1n,
				)

				// Verify the L2ScrollMessenger interaction
				expect(await l2ScrollMessenger.to()).to.equal(liquidity)
				expect(await l2ScrollMessenger.value()).to.equal(0)
				expect((await l2ScrollMessenger.message()).length).to.be.greaterThan(0)
				expect(await l2ScrollMessenger.gasLimit()).to.equal(UINT256_MAX)
				expect(await l2ScrollMessenger.sender()).to.equal(deployer.address)
				expect(await l2ScrollMessenger.msgValue()).to.equal(0)
			})

			it('should update the last relayed withdrawal IDs correctly', async () => {
				const [
					withdrawal,
					l2ScrollMessenger,
					mockPlonkVerifier,
					rollupTestForWithdrawal,
				] = await loadFixture(setup)
				const { deployer } = await getSigners()

				// Create and submit mixed withdrawals
				const directWithdrawalsCount = 10
				const claimableWithdrawalsCount = 10
				const directWithdrawals = getChainedWithdrawals(
					directWithdrawalsCount,
				).map((w) => ({
					...w,
					tokenIndex: DIRECT_WITHDRAWAL_TOKEN_INDICES[0],
				}))
				const claimableWithdrawals = getChainedWithdrawals(
					claimableWithdrawalsCount,
				).map((w) => ({
					...w,
					tokenIndex: 1000, // Non-direct withdrawal token index
				}))

				const allWithdrawals = [...directWithdrawals, ...claimableWithdrawals]
				const lastWithdrawalHash = getPrevHashFromWithdrawals(allWithdrawals)
				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				for (const w of allWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				// Submit all withdrawals
				await withdrawal.submitWithdrawalProof(
					allWithdrawals,
					validPublicInputs,
					'0x',
				)

				// Initial state check
				expect(await withdrawal.getLastRelayedDirectWithdrawalId()).to.equal(0n)
				expect(await withdrawal.getLastRelayedClaimableWithdrawalId()).to.equal(
					0n,
				)

				// First relay: only direct withdrawals
				await withdrawal.relayWithdrawals(5n, 0n)
				expect(await withdrawal.getLastRelayedDirectWithdrawalId()).to.equal(4n)
				expect(await withdrawal.getLastRelayedClaimableWithdrawalId()).to.equal(
					0n,
				)

				// Second relay: only claimable withdrawals
				await withdrawal.relayWithdrawals(5n, 6n)
				expect(await withdrawal.getLastRelayedDirectWithdrawalId()).to.equal(4n)
				expect(await withdrawal.getLastRelayedClaimableWithdrawalId()).to.equal(
					5n,
				)

				// Third relay: both types of withdrawals
				await withdrawal.relayWithdrawals(8n, 9n)
				expect(await withdrawal.getLastRelayedDirectWithdrawalId()).to.equal(7n)
				expect(await withdrawal.getLastRelayedClaimableWithdrawalId()).to.equal(
					8n,
				)

				// Final relay: up to the last ID for both types
				await withdrawal.relayWithdrawals(10n, 10n)
				expect(await withdrawal.getLastRelayedDirectWithdrawalId()).to.equal(9n)
				expect(await withdrawal.getLastRelayedClaimableWithdrawalId()).to.equal(
					9n,
				)
			})

			describe('fail', () => {
				it('should revert when trying to relay more than MAX_RELAY_DIRECT_WITHDRAWALS direct withdrawals', async () => {
					const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
						await loadFixture(setup)
					const { deployer } = await getSigners()

					// Create and submit more than MAX_RELAY_DIRECT_WITHDRAWALS direct withdrawals
					const directWithdrawals = getChainedWithdrawals(
						MAX_RELAY_DIRECT_WITHDRAWALS + 2,
					).map((w) => ({
						...w,
						tokenIndex: DIRECT_WITHDRAWAL_TOKEN_INDICES[0],
					}))

					const lastWithdrawalHash =
						getPrevHashFromWithdrawals(directWithdrawals)
					const validPublicInputs = {
						lastWithdrawalHash,
						withdrawalAggregator: deployer.address,
					}

					await mockPlonkVerifier.setResult(true)
					for (const w of directWithdrawals) {
						await rollupTestForWithdrawal.setTestData(
							w.blockNumber,
							w.blockHash,
						)
					}

					// Submit the withdrawals
					await withdrawal.submitWithdrawalProof(
						directWithdrawals,
						validPublicInputs,
						'0x',
					)

					// Try to relay more than MAX_RELAY_DIRECT_WITHDRAWALS
					await expect(
						withdrawal.relayWithdrawals(MAX_RELAY_DIRECT_WITHDRAWALS + 2, 0),
					).to.be.revertedWithCustomError(
						withdrawal,
						'TooManyRelayDirectWithdrawals',
					)
				})

				it('should revert when trying to relay more than MAX_RELAY_CLAIMABLE_WITHDRAWALS claimable withdrawals', async () => {
					const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
						await loadFixture(setup)
					const { deployer } = await getSigners()

					// Create and submit more than MAX_RELAY_CLAIMABLE_WITHDRAWALS claimable withdrawals
					const claimableWithdrawals = getChainedWithdrawals(
						MAX_RELAY_CLAIMABLE_WITHDRAWALS + 2,
					).map((w) => ({
						...w,
						tokenIndex: 1000, // Non-direct withdrawal token index
					}))

					const lastWithdrawalHash =
						getPrevHashFromWithdrawals(claimableWithdrawals)
					const validPublicInputs = {
						lastWithdrawalHash,
						withdrawalAggregator: deployer.address,
					}

					await mockPlonkVerifier.setResult(true)
					for (const w of claimableWithdrawals) {
						await rollupTestForWithdrawal.setTestData(
							w.blockNumber,
							w.blockHash,
						)
					}

					// Submit the withdrawals
					await withdrawal.submitWithdrawalProof(
						claimableWithdrawals,
						validPublicInputs,
						'0x',
					)

					// Try to relay more than MAX_RELAY_CLAIMABLE_WITHDRAWALS
					await expect(
						withdrawal.relayWithdrawals(0, MAX_RELAY_CLAIMABLE_WITHDRAWALS + 2),
					).to.be.revertedWithCustomError(
						withdrawal,
						'TooManyRelayClaimableWithdrawals',
					)
				})

				it('should revert when the directWithdrawalId is too large', async () => {
					const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
						await loadFixture(setup)
					const { deployer } = await getSigners()

					// Create and submit a few direct withdrawals
					const directWithdrawals = getChainedWithdrawals(5).map((w) => ({
						...w,
						tokenIndex: DIRECT_WITHDRAWAL_TOKEN_INDICES[0],
					}))

					const lastWithdrawalHash =
						getPrevHashFromWithdrawals(directWithdrawals)
					const validPublicInputs = {
						lastWithdrawalHash,
						withdrawalAggregator: deployer.address,
					}

					await mockPlonkVerifier.setResult(true)
					for (const w of directWithdrawals) {
						await rollupTestForWithdrawal.setTestData(
							w.blockNumber,
							w.blockHash,
						)
					}

					// Submit the withdrawals
					await withdrawal.submitWithdrawalProof(
						directWithdrawals,
						validPublicInputs,
						'0x',
					)

					// Get the current last direct withdrawal ID
					const lastDirectWithdrawalId =
						await withdrawal.getLastDirectWithdrawalId()

					// Try to relay with a directWithdrawalId that is too large
					const tooLargeId = lastDirectWithdrawalId + 2n
					await expect(withdrawal.relayWithdrawals(tooLargeId, 0))
						.to.be.revertedWithCustomError(
							withdrawal,
							'DirectWithdrawalIsTooLarge',
						)
						.withArgs(tooLargeId, lastDirectWithdrawalId + 1n)
				})

				it('should revert when the claimableWithdrawalId is too large', async () => {
					const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
						await loadFixture(setup)
					const { deployer } = await getSigners()

					// Create and submit a few claimable withdrawals
					const claimableWithdrawals = getChainedWithdrawals(5).map((w) => ({
						...w,
						tokenIndex: 1000, // Non-direct withdrawal token index
					}))

					const lastWithdrawalHash =
						getPrevHashFromWithdrawals(claimableWithdrawals)
					const validPublicInputs = {
						lastWithdrawalHash,
						withdrawalAggregator: deployer.address,
					}

					await mockPlonkVerifier.setResult(true)
					for (const w of claimableWithdrawals) {
						await rollupTestForWithdrawal.setTestData(
							w.blockNumber,
							w.blockHash,
						)
					}

					// Submit the withdrawals
					await withdrawal.submitWithdrawalProof(
						claimableWithdrawals,
						validPublicInputs,
						'0x',
					)

					// Get the current last claimable withdrawal ID
					const lastClaimableWithdrawalId =
						await withdrawal.getLastClaimableWithdrawalId()

					// Try to relay with a claimableWithdrawalId that is too large
					const tooLargeId = lastClaimableWithdrawalId + 2n
					await expect(withdrawal.relayWithdrawals(0, tooLargeId))
						.to.be.revertedWithCustomError(
							withdrawal,
							'ClaimableWithdrawalIsTooLarge',
						)
						.withArgs(tooLargeId, lastClaimableWithdrawalId + 1n)
				})
			})
		})
	})
	describe('relayDirectWithdrawals', () => {
		describe('success', () => {
			it('should relay direct withdrawals up to the specified ID', async () => {
				const [
					withdrawal,
					l2ScrollMessenger,
					mockPlonkVerifier,
					rollupTestForWithdrawal,
					liquidity,
				] = await loadFixture(setup)
				const { deployer } = await getSigners()

				// Create and submit direct withdrawals
				const directWithdrawalsCount = 10
				const directWithdrawals = getChainedWithdrawals(
					directWithdrawalsCount,
				).map((w) => ({
					...w,
					tokenIndex: DIRECT_WITHDRAWAL_TOKEN_INDICES[0],
				}))

				const lastWithdrawalHash = getPrevHashFromWithdrawals(directWithdrawals)
				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				for (const w of directWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}
				// Submit the withdrawals
				await withdrawal.submitWithdrawalProof(
					directWithdrawals,
					validPublicInputs,
					'0x',
				)
				// Relay direct withdrawals up to a specific ID
				const relayUpToId = 5n
				await withdrawal.relayDirectWithdrawals(relayUpToId)
				// Check that the correct number of withdrawals were relayed
				expect(await withdrawal.getLastRelayedDirectWithdrawalId()).to.equal(
					relayUpToId - 1n,
				)
				// Verify the L2ScrollMessenger interaction
				expect(await l2ScrollMessenger.to()).to.equal(liquidity)
				expect(await l2ScrollMessenger.value()).to.equal(0)
				expect((await l2ScrollMessenger.message()).length).to.equal(1162)
				expect(await l2ScrollMessenger.gasLimit()).to.equal(UINT256_MAX)
				expect(await l2ScrollMessenger.sender()).to.equal(deployer.address)
				expect(await l2ScrollMessenger.msgValue()).to.equal(0)
			})
		})

		describe('fail', () => {
			it('should revert when trying to relay more than MAX_RELAY_DIRECT_WITHDRAWALS', async () => {
				const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				// Create and submit more than MAX_RELAY_DIRECT_WITHDRAWALS direct withdrawals
				const directWithdrawals = getChainedWithdrawals(
					MAX_RELAY_DIRECT_WITHDRAWALS + 2,
				).map((w) => ({
					...w,
					tokenIndex: DIRECT_WITHDRAWAL_TOKEN_INDICES[0],
				}))

				const lastWithdrawalHash = getPrevHashFromWithdrawals(directWithdrawals)
				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				for (const w of directWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				// Submit the withdrawals
				await withdrawal.submitWithdrawalProof(
					directWithdrawals,
					validPublicInputs,
					'0x',
				)

				// Try to relay more than MAX_RELAY_DIRECT_WITHDRAWALS
				await expect(
					withdrawal.relayDirectWithdrawals(
						BigInt(MAX_RELAY_DIRECT_WITHDRAWALS + 2),
					),
				).to.be.revertedWithCustomError(
					withdrawal,
					'TooManyRelayDirectWithdrawals',
				)
			})

			it('should revert when the directWithdrawalId is too large', async () => {
				const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				// Create and submit a few direct withdrawals
				const directWithdrawals = getChainedWithdrawals(5).map((w) => ({
					...w,
					tokenIndex: DIRECT_WITHDRAWAL_TOKEN_INDICES[0],
				}))

				const lastWithdrawalHash = getPrevHashFromWithdrawals(directWithdrawals)
				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				for (const w of directWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				// Submit the withdrawals
				await withdrawal.submitWithdrawalProof(
					directWithdrawals,
					validPublicInputs,
					'0x',
				)

				// Get the current last direct withdrawal ID
				const lastDirectWithdrawalId =
					await withdrawal.getLastDirectWithdrawalId()

				// Try to relay with a directWithdrawalId that is too large
				const tooLargeId = lastDirectWithdrawalId + 2n
				await expect(withdrawal.relayDirectWithdrawals(tooLargeId))
					.to.be.revertedWithCustomError(
						withdrawal,
						'DirectWithdrawalIsTooLarge',
					)
					.withArgs(tooLargeId, lastDirectWithdrawalId + 1n)
			})
		})
	})

	describe('relayClaimableWithdrawals', () => {
		describe('success', () => {
			it('should relay claimable withdrawals up to the specified ID', async () => {
				const [
					withdrawal,
					l2ScrollMessenger,
					mockPlonkVerifier,
					rollupTestForWithdrawal,
					liquidity,
				] = await loadFixture(setup)
				const { deployer } = await getSigners()

				// Create and submit claimable withdrawals
				const claimableWithdrawalsCount = 10
				const claimableWithdrawals = getChainedWithdrawals(
					claimableWithdrawalsCount,
				).map((w) => ({
					...w,
					tokenIndex: 1000, // Non-direct withdrawal token index
				}))

				const lastWithdrawalHash =
					getPrevHashFromWithdrawals(claimableWithdrawals)
				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				for (const w of claimableWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				// Submit the withdrawals
				await withdrawal.submitWithdrawalProof(
					claimableWithdrawals,
					validPublicInputs,
					'0x',
				)

				// Relay claimable withdrawals up to a specific ID
				const relayUpToId = 5n
				await withdrawal.relayClaimableWithdrawals(relayUpToId)

				// Check that the correct number of withdrawals were relayed
				expect(await withdrawal.getLastRelayedClaimableWithdrawalId()).to.equal(
					relayUpToId - 1n,
				)

				// Verify the L2ScrollMessenger interaction
				expect(await l2ScrollMessenger.to()).to.equal(liquidity)
				expect(await l2ScrollMessenger.value()).to.equal(0)
				expect((await l2ScrollMessenger.message()).length).to.equal(394)
				expect(await l2ScrollMessenger.gasLimit()).to.equal(UINT256_MAX)
				expect(await l2ScrollMessenger.sender()).to.equal(deployer.address)
				expect(await l2ScrollMessenger.msgValue()).to.equal(0)
			})
		})

		describe('fail', () => {
			it('should revert when trying to relay more than MAX_RELAY_CLAIMABLE_WITHDRAWALS', async () => {
				const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				// Create and submit more than MAX_RELAY_CLAIMABLE_WITHDRAWALS claimable withdrawals
				const claimableWithdrawals = getChainedWithdrawals(
					MAX_RELAY_CLAIMABLE_WITHDRAWALS + 2,
				).map((w) => ({
					...w,
					tokenIndex: 1000, // Non-direct withdrawal token index
				}))

				const lastWithdrawalHash =
					getPrevHashFromWithdrawals(claimableWithdrawals)
				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				for (const w of claimableWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				// Submit the withdrawals
				await withdrawal.submitWithdrawalProof(
					claimableWithdrawals,
					validPublicInputs,
					'0x',
				)

				// Try to relay more than MAX_RELAY_CLAIMABLE_WITHDRAWALS
				await expect(
					withdrawal.relayClaimableWithdrawals(
						BigInt(MAX_RELAY_CLAIMABLE_WITHDRAWALS + 2),
					),
				).to.be.revertedWithCustomError(
					withdrawal,
					'TooManyRelayClaimableWithdrawals',
				)
			})

			it('should revert when the claimableWithdrawalId is too large', async () => {
				const [withdrawal, , mockPlonkVerifier, rollupTestForWithdrawal] =
					await loadFixture(setup)
				const { deployer } = await getSigners()

				// Create and submit a few claimable withdrawals
				const claimableWithdrawals = getChainedWithdrawals(5).map((w) => ({
					...w,
					tokenIndex: 1000, // Non-direct withdrawal token index
				}))

				const lastWithdrawalHash =
					getPrevHashFromWithdrawals(claimableWithdrawals)
				const validPublicInputs = {
					lastWithdrawalHash,
					withdrawalAggregator: deployer.address,
				}

				await mockPlonkVerifier.setResult(true)
				for (const w of claimableWithdrawals) {
					await rollupTestForWithdrawal.setTestData(w.blockNumber, w.blockHash)
				}

				// Submit the withdrawals
				await withdrawal.submitWithdrawalProof(
					claimableWithdrawals,
					validPublicInputs,
					'0x',
				)

				// Get the current last claimable withdrawal ID
				const lastClaimableWithdrawalId =
					await withdrawal.getLastClaimableWithdrawalId()

				// Try to relay with a claimableWithdrawalId that is too large
				const tooLargeId = lastClaimableWithdrawalId + 2n
				await expect(withdrawal.relayClaimableWithdrawals(tooLargeId))
					.to.be.revertedWithCustomError(
						withdrawal,
						'ClaimableWithdrawalIsTooLarge',
					)
					.withArgs(tooLargeId, lastClaimableWithdrawalId + 1n)
			})
		})
	})
	describe('upgrade', () => {
		it('channel contract is upgradable', async () => {
			const [withdrawal] = await loadFixture(setup)
			const { deployer } = await getSigners()
			const withdrawal2Factory =
				await ethers.getContractFactory('Withdrawal2Test')
			const next = await upgrades.upgradeProxy(
				await withdrawal.getAddress(),
				withdrawal2Factory,
			)
			const owner = await withdrawal.owner()
			expect(owner).to.equal(deployer.address)
			const val = await next.getVal()
			expect(val).to.equal(3)
		})
		it('Cannot upgrade except for a deployer.', async () => {
			const [withdrawal] = await loadFixture(setup)
			const signers = await getSigners()
			const withdrawal2Factory = await ethers.getContractFactory(
				'Withdrawal2Test',
				signers.user,
			)
			await expect(
				upgrades.upgradeProxy(
					await withdrawal.getAddress(),
					withdrawal2Factory,
				),
			)
				.to.be.revertedWithCustomError(withdrawal, 'OwnableUnauthorizedAccount')
				.withArgs(signers.user.address)
		})
	})
})
