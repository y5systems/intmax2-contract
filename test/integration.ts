import { ethers, upgrades } from 'hardhat'
import type {
	BlockBuilderRegistry,
	Liquidity,
	MockL1ScrollMessenger,
	MockL2ScrollMessenger,
	MockPlonkVerifier,
	Withdrawal,
	Rollup,
	TestERC20,
} from '../typechain-types'
import { expect } from 'chai'
import { loadFullBlocks, postBlock } from './utils/rollup'
import { getRandomPubkey, getRandomSalt } from '../scripts/utils/rand'
import { getPubkeySaltHash } from '../scripts/utils/hash'
import { loadWithdrawalInfo } from './utils/withdrawal'

describe('Integration', function () {
	let l1ScrollMessenger: MockL1ScrollMessenger
	let l2ScrollMessenger: MockL2ScrollMessenger
	let withdrawalVerifier: MockPlonkVerifier
	let fraudVerifier: MockPlonkVerifier

	let rollup: Rollup
	let withdrawal: Withdrawal
	let registry: BlockBuilderRegistry
	let liquidity: Liquidity

	let testToken: TestERC20

	this.beforeEach(async function () {
		// test token
		const deployer = (await ethers.getSigners())[0]
		const TestERC20_ = await ethers.getContractFactory('TestERC20')
		testToken = (await TestERC20_.deploy(deployer)) as TestERC20

		// scroll messanger deployment
		const MockL1ScrollMessenger_ = await ethers.getContractFactory(
			'MockL1ScrollMessenger',
		)
		l1ScrollMessenger =
			(await MockL1ScrollMessenger_.deploy()) as MockL1ScrollMessenger
		const MockL2ScrollMessenger_ = await ethers.getContractFactory(
			'MockL2ScrollMessenger',
		)
		l2ScrollMessenger =
			(await MockL2ScrollMessenger_.deploy()) as MockL2ScrollMessenger
		await l1ScrollMessenger.initialize(await l2ScrollMessenger.getAddress())
		await l2ScrollMessenger.initialize(await l1ScrollMessenger.getAddress())

		// plonk verifier deployment
		const MockPlonkVerifier_ =
			await ethers.getContractFactory('MockPlonkVerifier')
		withdrawalVerifier =
			(await MockPlonkVerifier_.deploy()) as MockPlonkVerifier
		fraudVerifier = (await MockPlonkVerifier_.deploy()) as MockPlonkVerifier

		// L2 deployments. Initialize later.
		const rollupFactory = await ethers.getContractFactory('Rollup')
		rollup = (await upgrades.deployProxy(rollupFactory, [], {
			initializer: false,
			kind: 'uups',
		})) as unknown as Rollup
		const withdrawalFactory = await ethers.getContractFactory('Withdrawal')
		withdrawal = (await upgrades.deployProxy(withdrawalFactory, [], {
			initializer: false,
			kind: 'uups',
		})) as unknown as Withdrawal
		const registryFactory = await ethers.getContractFactory(
			'BlockBuilderRegistry',
		)
		registry = (await upgrades.deployProxy(registryFactory, [], {
			initializer: false,
			kind: 'uups',
		})) as unknown as BlockBuilderRegistry

		// L1 deployment. Initialize later.
		const liquidityFactory = await ethers.getContractFactory('Liquidity')
		liquidity = (await upgrades.deployProxy(liquidityFactory, [], {
			initializer: false,
			kind: 'uups',
		})) as unknown as Liquidity

		// get address
		const testTokenAddress = await testToken.getAddress()
		const l1ScrollMessengerAddress = await l1ScrollMessenger.getAddress()
		const l2ScrollMessengerAddress = await l2ScrollMessenger.getAddress()
		const withdrawalVerifierAddress = await withdrawalVerifier.getAddress()
		const fraudVerifierAddress = await fraudVerifier.getAddress()
		const rollupAddress = await rollup.getAddress()
		const withdrawalAddress = await withdrawal.getAddress()
		const liquidityAddress = await liquidity.getAddress()
		const registryAddress = await registry.getAddress()

		// L1 initialize
		await liquidity.initialize(
			l1ScrollMessengerAddress,
			rollupAddress,
			withdrawalAddress,
			[testTokenAddress], // testToken
		)

		// L2 initialize
		await rollup.initialize(
			l2ScrollMessengerAddress,
			liquidityAddress,
			registryAddress,
		)
		await withdrawal.initialize(
			l2ScrollMessenger,
			withdrawalVerifierAddress,
			liquidity,
			rollupAddress,
			[0, 1], // 0: eth, 1: testToken
		)
		await registry.initialize(rollupAddress, fraudVerifierAddress)
	})

	it('deposit', async function () {
		// deposit on L1
		const owner = (await ethers.getSigners())[0]
		const user = (await ethers.getSigners())[1]
		const depositAmount = ethers.parseEther('100') // deposit 100 testToken
		// fund token to user
		await testToken
			.connect(owner)
			.transfer(await user.getAddress(), depositAmount)
		// approve token to liquidity
		await testToken
			.connect(user)
			.approve(await liquidity.getAddress(), depositAmount)
		const pubkey = getRandomPubkey() // intmax address of user
		const salt = getRandomSalt() // random salt
		const pubkeySaltHash = getPubkeySaltHash(pubkey, salt)
		await liquidity
			.connect(user)
			.depositERC20(await testToken.getAddress(), pubkeySaltHash, depositAmount)
		const depositEvent = (
			await liquidity.queryFilter(liquidity.filters.Deposited())
		)[0]
		const depositId = depositEvent.args.depositId
		await liquidity.connect(owner).analyzeDeposits(depositId, [])
		const analyzedEvent = (
			await liquidity.queryFilter(liquidity.filters.DepositsAnalyzed())
		)[0]
		const analyzedDepositId = analyzedEvent.args.lastAnalyzedDepositId
		expect(analyzedDepositId).to.be.eq(depositId)
		await liquidity.relayDeposits(analyzedDepositId, 400_000, {
			value: ethers.parseEther('0.1'), // will be refunded automatically
		})
		const relayedEvent = (
			await liquidity.queryFilter(liquidity.filters.DepositsRelayed())
		)[0]
		const { message } = relayedEvent.args
		// this is not required in the production environment,
		// because scroll messenger will relay the message to L2 automatically.
		// but for testing, we need to call relayMessage manually.
		{
			// get message nonce
			const sentEvent = (
				await l1ScrollMessenger.queryFilter(
					l1ScrollMessenger.filters.SentMessage(),
				)
			)[0]
			const { messageNonce, gasLimit } = sentEvent.args
			const from = await liquidity.getAddress()
			const to = await rollup.getAddress()
			const value = 0
			// notice: this may fail silently if the gasLimit is not enough.
			await l2ScrollMessenger.relayMessage(
				from,
				to,
				value,
				messageNonce,
				message,
				{ gasLimit },
			)
		}

		// check deposit
		const depositProcessedEvent = (
			await rollup.queryFilter(rollup.filters.DepositsProcessed())
		)[0]
		const { lastProcessedDepositId } = depositProcessedEvent.args
		expect(lastProcessedDepositId).to.be.eq(depositId)
	})

	it('withdrawal', async function () {
		// setup: post blocks
		const fullBlocks = loadFullBlocks()
		for (let i = 1; i < 3; i++) {
			await postBlock(fullBlocks[i], rollup)
		}
		// setup: fund liquidity contract for withdrawal liquidity
		const liquidityAddress = await liquidity.getAddress()
		await liquidity.depositETH(ethers.ZeroHash, {
			value: ethers.parseEther('100'),
		})
		await testToken.transfer(liquidityAddress, ethers.parseEther('100'))

		// withdrawal on L2
		const withdrawalInfo = loadWithdrawalInfo()
		await withdrawal.submitWithdrawalProof(
			withdrawalInfo.withdrawals,
			withdrawalInfo.withdrawalProofPublicInputs,
			'0x',
		)
		const directWithdrawalEvents = await withdrawal.queryFilter(
			withdrawal.filters.DirectWithdrawalQueued(),
		)
		const lastDirectWithdrawalEvent =
			directWithdrawalEvents[directWithdrawalEvents.length - 1]
		const lastDirectWithdrawalId =
			lastDirectWithdrawalEvent.args.directWithdrawalId

		// relay withdrawal
		await withdrawal.relayWithdrawals(lastDirectWithdrawalId, 0)

		const sentEvent = (
			await l2ScrollMessenger.queryFilter(
				l2ScrollMessenger.filters.SentMessage(),
			)
		)[0]
		const { message, messageNonce } = sentEvent.args
		// relay by l1 scroll messenger
		const from = await withdrawal.getAddress()
		const to = await liquidity.getAddress()
		const value = 0
		const proof = {
			batchIndex: 0,
			merkleProof: '0x',
		}
		await l1ScrollMessenger.relayMessageWithProof(
			from,
			to,
			value,
			messageNonce,
			message,
			proof,
		)
		// check event
		const directProcessEvent = (
			await liquidity.queryFilter(
				liquidity.filters.DirectWithdrawalsProcessed(),
			)
		)[0]
		const { lastProcessedDirectWithdrawalId } = directProcessEvent.args
		expect(lastProcessedDirectWithdrawalId).to.be.eq(lastDirectWithdrawalId)
	})
})
