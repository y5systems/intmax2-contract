import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { Contribution } from '../../typechain-types'

describe('Contribution', function () {
	const setup = async (): Promise<[Contribution]> => {
		const contributionFactory = await ethers.getContractFactory('Contribution')
		const contribution = (await upgrades.deployProxy(contributionFactory, [], {
			kind: 'uups',
		})) as unknown as Contribution
		const tagsStr = ['tag1', 'tag2', 'tag3']
		const tags = tagsStr.map((tag) =>
			ethers.solidityPackedKeccak256(['string'], [tag]),
		)
		const weights = [1, 2, 3]
		await contribution.registerWeights(0, tags, weights)
		return [contribution]
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
		it('deployer has admin role', async () => {
			const [contribution] = await loadFixture(setup)
			const signers = await getSigners()
			const adminRole = await contribution.DEFAULT_ADMIN_ROLE()
			expect(await contribution.hasRole(adminRole, signers.deployer.address)).to
				.be.true
		})
		it('deployer has WEIGHT_REGISTRAR role', async () => {
			const [contribution] = await loadFixture(setup)
			const signers = await getSigners()
			const role = await contribution.WEIGHT_REGISTRAR()
			expect(await contribution.hasRole(role, signers.deployer.address)).to.be
				.true
		})
		it('deployer has CONTRIBUTOR role', async () => {
			const [contribution] = await loadFixture(setup)
			const signers = await getSigners()
			const role = await contribution.CONTRIBUTOR()
			expect(await contribution.hasRole(role, signers.deployer.address)).to.be
				.true
		})
	})
	describe('incrementPeriod', () => {
		describe('success', () => {
			it('only weight registrar', async () => {
				const [contribution] = await loadFixture(setup)
				const { deployer } = await getSigners()
				const period = await contribution.currentPeriod()
				await contribution.connect(deployer).incrementPeriod()
				expect(await contribution.currentPeriod()).to.be.equal(period + 1n)
			})
		})
		describe('fail', () => {
			it('only weight registrar', async () => {
				const [contribution] = await loadFixture(setup)
				const { user } = await getSigners()
				const role = await contribution.WEIGHT_REGISTRAR()
				await expect(contribution.connect(user).incrementPeriod())
					.to.be.revertedWithCustomError(
						contribution,
						'AccessControlUnauthorizedAccount',
					)
					.withArgs(user.address, role)
			})
		})
	})
	describe('registerWeights', () => {
		describe('success', () => {
			it('set register weights', async () => {
				const [contribution] = await loadFixture(setup)
				const { deployer } = await getSigners()
				// TODO
			})
		})
		describe('fail', () => {
			it('only weight registrar', async () => {
				const [contribution] = await loadFixture(setup)
				const { user } = await getSigners()
				const role = await contribution.WEIGHT_REGISTRAR()
				// TODO
			})
			it('InvalidInputLength', async () => {
				const [contribution] = await loadFixture(setup)
				// TODO
			})
		})
	})

	it('should be able to record contribution', async function () {
		const [contribution] = await loadFixture(setup)
		const tag = ethers.solidityPackedKeccak256(['string'], ['tag1'])
		const users = await ethers.getSigners()
		const user1 = users[0]
		const user2 = users[1]
		await contribution.recordContribution(tag, await user1.getAddress(), 10)
		await contribution.recordContribution(tag, await user2.getAddress(), 20)

		const user1Contribution = await contribution.getContributionRate(
			0,
			await user1.getAddress(),
		)
		const user2Contribution = await contribution.getContributionRate(
			0,
			await user2.getAddress(),
		)

		console.log('user1Contribution', user1Contribution.toString())
		console.log('user2Contribution', user2Contribution.toString())
	})
})
