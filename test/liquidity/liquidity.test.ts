import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import {
	Liquidity,
	L1ScrollMessengerTestForLiquidity,
	ContributionTest,
	TestERC20,
	TestNFT,
	TestERC1155,
} from '../../typechain-types'

import { INITIAL_ERC20_TOKEN_ADDRESSES } from './common.test'

describe('Liquidity', () => {
	type TestObjects = {
		liquidity: Liquidity
		scrollMessenger: L1ScrollMessengerTestForLiquidity
		rollup: string
		withdrawal: string
		contribution: ContributionTest
	}
	async function setup(): Promise<TestObjects> {
		const l1ScrollMessengerFactory = await ethers.getContractFactory(
			'L1ScrollMessengerTestForLiquidity',
		)
		const l1ScrollMessenger = await l1ScrollMessengerFactory.deploy()
		const rollup = ethers.Wallet.createRandom().address
		const withdrawal = ethers.Wallet.createRandom().address
		const contributionFactory =
			await ethers.getContractFactory('ContributionTest')
		const contribution = await contributionFactory.deploy()
		const { analyzer } = await getSigners()
		const liquidityFactory = await ethers.getContractFactory('Liquidity')
		const liquidity = (await upgrades.deployProxy(
			liquidityFactory,
			[
				await l1ScrollMessenger.getAddress(),
				rollup,
				withdrawal,
				analyzer.address,
				await contribution.getAddress(),
				INITIAL_ERC20_TOKEN_ADDRESSES,
			],
			{ kind: 'uups' },
		)) as unknown as Liquidity
		return {
			liquidity,
			scrollMessenger: l1ScrollMessenger,
			rollup,
			withdrawal,
			contribution,
		}
	}
	type Signers = {
		deployer: HardhatEthersSigner
		analyzer: HardhatEthersSigner
		user: HardhatEthersSigner
	}
	const getSigners = async (): Promise<Signers> => {
		const [deployer, analyzer, user] = await ethers.getSigners()
		return {
			deployer,
			analyzer,
			user,
		}
	}
	describe('initialize', () => {
		describe('success', () => {
			it('deployer has admin role', async () => {
				const { liquidity } = await loadFixture(setup)
				const { deployer } = await getSigners()
				const role = await liquidity.DEFAULT_ADMIN_ROLE()
				expect(await liquidity.hasRole(role, deployer.address)).to.be.true
			})
			it('analyzer has analyzer role', async () => {
				const { liquidity } = await loadFixture(setup)
				const { analyzer } = await getSigners()
				const role = await liquidity.ANALYZER()
				expect(await liquidity.hasRole(role, analyzer.address)).to.be.true
			})
		})
		describe('fail', () => {
			it('should revert when initializing twice', async () => {
				const { liquidity } = await loadFixture(setup)

				await expect(
					liquidity.initialize(
						ethers.ZeroAddress,
						ethers.ZeroAddress,
						ethers.ZeroAddress,
						ethers.ZeroAddress,
						ethers.ZeroAddress,
						[ethers.ZeroAddress, ethers.ZeroAddress],
					),
				).to.be.revertedWithCustomError(liquidity, 'InvalidInitialization')
			})
		})
	})
	describe('depositETH', () => {
		describe('success', () => {
			it('emit Deposited event', async () => {
				const { liquidity } = await loadFixture(setup)
				const { user } = await getSigners()
				const recipientSaltHash = ethers.keccak256(ethers.toUtf8Bytes('test'))
				const depositAmount = ethers.parseEther('1')

				const currentDepositId = await liquidity.getLastDepositId()
				const currentTimestamp = await ethers.provider.getBlock('latest')

				await expect(
					liquidity
						.connect(user)
						.depositETH(recipientSaltHash, { value: depositAmount }),
				)
					.to.emit(liquidity, 'Deposited')
					.withArgs(
						currentDepositId + 1n,
						user.address,
						recipientSaltHash,
						0, // tokenIndex for ETH should be 0
						depositAmount,
						currentTimestamp!.timestamp + 1,
					)
			})
			it('transfer eth', async () => {
				const { liquidity } = await loadFixture(setup)
				const { user } = await getSigners()
				const recipientSaltHash = ethers.keccak256(ethers.toUtf8Bytes('test'))
				const depositAmount = ethers.parseEther('1')

				const initialBalance = await ethers.provider.getBalance(
					await liquidity.getAddress(),
				)
				await liquidity
					.connect(user)
					.depositETH(recipientSaltHash, { value: depositAmount })
				const finalBalance = await ethers.provider.getBalance(
					await liquidity.getAddress(),
				)

				expect(finalBalance - initialBalance).to.equal(depositAmount)
			})
		})

		describe('fail', () => {
			it('revert InvalidValue', async () => {
				const { liquidity } = await loadFixture(setup)
				const { user } = await getSigners()
				const recipientSaltHash = ethers.keccak256(ethers.toUtf8Bytes('test'))

				await expect(
					liquidity.connect(user).depositETH(recipientSaltHash, { value: 0 }),
				).to.be.revertedWithCustomError(liquidity, 'InvalidValue')
			})
		})
	})
	describe('depositERC20', () => {
		type TestObjectsForDepositERC20 = TestObjects & {
			testERC20: TestERC20
		}
		async function setupForDepositERC20(): Promise<TestObjectsForDepositERC20> {
			const testObjects = await loadFixture(setup)
			const { user } = await getSigners()

			const testERC20Factory = await ethers.getContractFactory('TestERC20')
			const testERC20 = await testERC20Factory.deploy(user.address)
			return {
				...testObjects,
				testERC20,
			}
		}
		describe('success', () => {
			it('emit Deposited event', async () => {
				const { liquidity, testERC20 } = await loadFixture(setupForDepositERC20)
				const { user } = await getSigners()
				const recipientSaltHash = ethers.keccak256(ethers.toUtf8Bytes('test'))
				const depositAmount = ethers.parseEther('100')

				await testERC20
					.connect(user)
					.approve(await liquidity.getAddress(), depositAmount)

				const currentDepositId = await liquidity.getLastDepositId()
				const currentTimestamp = await ethers.provider.getBlock('latest')

				await expect(
					liquidity
						.connect(user)
						.depositERC20(
							await testERC20.getAddress(),
							recipientSaltHash,
							depositAmount,
						),
				)
					.to.emit(liquidity, 'Deposited')
					.withArgs(
						currentDepositId + 1n,
						user.address,
						recipientSaltHash,
						3, // new token index
						depositAmount,
						currentTimestamp!.timestamp + 1,
					)
			})
			it('transfer ERC20', async () => {
				const { liquidity, testERC20 } = await loadFixture(setupForDepositERC20)
				const { user } = await getSigners()
				const recipientSaltHash = ethers.keccak256(ethers.toUtf8Bytes('test'))
				const depositAmount = ethers.parseEther('100')

				await testERC20
					.connect(user)
					.approve(await liquidity.getAddress(), depositAmount)

				const erc20Address = await testERC20.getAddress()

				await expect(() =>
					liquidity
						.connect(user)
						.depositERC20(erc20Address, recipientSaltHash, depositAmount),
				).to.changeTokenBalances(
					testERC20,
					[user, liquidity],
					[-depositAmount, depositAmount],
				)
			})
		})

		describe('fail', () => {
			it('revert InvalidAmount', async () => {
				const { liquidity, testERC20 } = await loadFixture(setupForDepositERC20)
				const { user } = await getSigners()
				const recipientSaltHash = ethers.keccak256(ethers.toUtf8Bytes('test'))

				await expect(
					liquidity
						.connect(user)
						.depositERC20(await testERC20.getAddress(), recipientSaltHash, 0),
				).to.be.revertedWithCustomError(liquidity, 'InvalidAmount')
			})
		})
	})

	describe('depositERC721', () => {
		type TestObjectsForDepositERC721 = TestObjects & {
			testNFT: TestNFT
		}
		async function setupForDepositERC721(): Promise<TestObjectsForDepositERC721> {
			const testObjects = await loadFixture(setup)
			const { user } = await getSigners()

			const testNFTFactory = await ethers.getContractFactory('TestNFT')
			const testNFT = await testNFTFactory.connect(user).deploy()
			return {
				...testObjects,
				testNFT,
			}
		}
		it('emit Deposited event', async () => {
			const { liquidity, testNFT } = await loadFixture(setupForDepositERC721)
			const { user } = await getSigners()
			const recipientSaltHash = ethers.keccak256(ethers.toUtf8Bytes('test'))
			const tokenId = 0

			await testNFT.connect(user).approve(await liquidity.getAddress(), tokenId)

			const currentDepositId = await liquidity.getLastDepositId()
			const currentTimestamp = await ethers.provider.getBlock('latest')

			await expect(
				liquidity
					.connect(user)
					.depositERC721(
						await testNFT.getAddress(),
						recipientSaltHash,
						tokenId,
					),
			)
				.to.emit(liquidity, 'Deposited')
				.withArgs(
					currentDepositId + 1n,
					user.address,
					recipientSaltHash,
					3, // new token index
					1, // amount is always 1 for ERC721
					currentTimestamp!.timestamp + 1,
				)
		})
		it('transfer NFT', async () => {
			const { liquidity, testNFT } = await loadFixture(setupForDepositERC721)
			const { user } = await getSigners()
			const recipientSaltHash = ethers.keccak256(ethers.toUtf8Bytes('test'))
			const tokenId = 0

			await testNFT.connect(user).approve(await liquidity.getAddress(), tokenId)

			expect(await testNFT.ownerOf(tokenId)).to.equal(user.address)

			await liquidity
				.connect(user)
				.depositERC721(await testNFT.getAddress(), recipientSaltHash, tokenId)

			expect(await testNFT.ownerOf(tokenId)).to.equal(
				await liquidity.getAddress(),
			)
		})
	})
	describe('depositERC1155', () => {
		type TestObjectsForDepositERC1155 = TestObjects & {
			testERC1155: TestERC1155
		}
		async function setupForDepositERC1155(): Promise<TestObjectsForDepositERC1155> {
			const testObjects = await loadFixture(setup)
			const { user } = await getSigners()

			const test1155Factory = await ethers.getContractFactory('TestERC1155')
			const testERC1155 = await test1155Factory.connect(user).deploy()
			const tokenId = 1
			const amount = 100
			await testERC1155.mint(user.address, tokenId, amount, '0x')

			return {
				...testObjects,
				testERC1155,
			}
		}
		describe('success', () => {
			it('emit Deposited event', async () => {
				const { liquidity, testERC1155 } = await loadFixture(
					setupForDepositERC1155,
				)
				const { user } = await getSigners()
				const recipientSaltHash = ethers.keccak256(ethers.toUtf8Bytes('test'))
				const tokenId = 1
				const depositAmount = 50

				await testERC1155
					.connect(user)
					.setApprovalForAll(await liquidity.getAddress(), true)

				const currentDepositId = await liquidity.getLastDepositId()
				const currentTimestamp = await ethers.provider.getBlock('latest')

				await expect(
					liquidity
						.connect(user)
						.depositERC1155(
							await testERC1155.getAddress(),
							recipientSaltHash,
							tokenId,
							depositAmount,
						),
				)
					.to.emit(liquidity, 'Deposited')
					.withArgs(
						currentDepositId + 1n,
						user.address,
						recipientSaltHash,
						3, // new token index for the first ERC1155
						depositAmount,
						currentTimestamp!.timestamp + 1,
					)
			})
			it('transfer ERC1155', async () => {
				const { liquidity, testERC1155 } = await loadFixture(
					setupForDepositERC1155,
				)
				const { user } = await getSigners()
				const recipientSaltHash = ethers.keccak256(ethers.toUtf8Bytes('test'))
				const tokenId = 1
				const depositAmount = 50

				await testERC1155
					.connect(user)
					.setApprovalForAll(await liquidity.getAddress(), true)

				const userInitialBalance = await testERC1155.balanceOf(
					user.address,
					tokenId,
				)
				const liquidityInitialBalance = await testERC1155.balanceOf(
					await liquidity.getAddress(),
					tokenId,
				)

				await liquidity
					.connect(user)
					.depositERC1155(
						await testERC1155.getAddress(),
						recipientSaltHash,
						tokenId,
						depositAmount,
					)

				const userFinalBalance = await testERC1155.balanceOf(
					user.address,
					tokenId,
				)
				const liquidityFinalBalance = await testERC1155.balanceOf(
					await liquidity.getAddress(),
					tokenId,
				)

				expect(userFinalBalance).to.equal(
					userInitialBalance - BigInt(depositAmount),
				)
				expect(liquidityFinalBalance).to.equal(
					liquidityInitialBalance + BigInt(depositAmount),
				)
			})
		})
		describe('fail', () => {
			it('revert InvalidAmount', async () => {
				const { liquidity, testERC1155 } = await loadFixture(
					setupForDepositERC1155,
				)
				const { user } = await getSigners()
				const recipientSaltHash = ethers.keccak256(ethers.toUtf8Bytes('test'))
				const tokenId = 1
				const depositAmount = 0

				await testERC1155
					.connect(user)
					.setApprovalForAll(await liquidity.getAddress(), true)

				await expect(
					liquidity
						.connect(user)
						.depositERC1155(
							await testERC1155.getAddress(),
							recipientSaltHash,
							tokenId,
							depositAmount,
						),
				).to.be.revertedWithCustomError(liquidity, 'InvalidAmount')
			})
		})
	})
	describe('upgrade', () => {
		it('channel contract is upgradable', async () => {
			const { liquidity } = await loadFixture(setup)
			const liquidity2Factory =
				await ethers.getContractFactory('Liquidity2Test')
			const next = await upgrades.upgradeProxy(
				await liquidity.getAddress(),
				liquidity2Factory,
			)
			const beforeRole = await liquidity.ANALYZER()

			const afterRole = await next.ANALYZER()
			expect(afterRole).to.equal(beforeRole)
			const val = await next.getVal()
			expect(val).to.equal(7)
		})
		it('Cannot upgrade except for a deployer.', async () => {
			const { liquidity } = await loadFixture(setup)
			const { user } = await getSigners()
			const liquidity2Factory = await ethers.getContractFactory(
				'Liquidity2Test',
				user,
			)
			const role = await liquidity.DEFAULT_ADMIN_ROLE()
			await expect(
				upgrades.upgradeProxy(await liquidity.getAddress(), liquidity2Factory),
			)
				.to.be.revertedWithCustomError(
					liquidity,
					'AccessControlUnauthorizedAccount',
				)
				.withArgs(user.address, role)
		})
	})
})
