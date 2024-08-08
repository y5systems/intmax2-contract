import { ethers, upgrades } from 'hardhat'
import { Contribution } from '../../typechain-types'

describe('Contribution', function () {
	let contribution: Contribution

	beforeEach(async function () {
		const contributionFactory = await ethers.getContractFactory('Contribution')
		contribution = (await upgrades.deployProxy(contributionFactory, [], {
			kind: 'uups',
		})) as unknown as Contribution
		// register the weight of the contribution
		const tagsStr = ['tag1', 'tag2', 'tag3']
		const tags = tagsStr.map((tag) =>
			ethers.solidityPackedKeccak256(['string'], [tag]),
		)
		const weights = [1, 2, 3]
		await contribution.registerWeights(0, tags, weights)

		const allTags = await contribution.getAllTags()
		console.log('allTags', allTags)
	})

	it('should be able to record contribution', async function () {
		const tag = ethers.solidityPackedKeccak256(['string'], ['tag1'])
		const users = await ethers.getSigners()
		const user1 = users[0]
		const user2 = users[1]
		await contribution.recordContribution(0, tag, await user1.getAddress(), 10)
		await contribution.recordContribution(0, tag, await user2.getAddress(), 20)

		const user1ContributionPerTag = await contribution.getContributionRateOfTag(
			0,
			tag,
			await user1.getAddress(),
		)
		console.log('user1ContributionPerTag', user1ContributionPerTag.toString())

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
