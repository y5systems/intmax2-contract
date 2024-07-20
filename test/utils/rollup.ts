import { Rollup } from '../../typechain-types'
import * as fs from 'fs'

export function loadFullBlocks(): FullBlock[] {
	let fullBlocks = []
	for (let i = 0; i < 3; i++) {
		const data = fs.readFileSync(`test_data/block${i}.json`, 'utf8')
		const jsonData = JSON.parse(data) as FullBlock
		fullBlocks.push(jsonData)
	}
	return fullBlocks
}

export async function postBlock(
	fullBlock: FullBlock,
	rollup: Rollup,
): Promise<void> {
	if (fullBlock.signature.isRegistorationBlock) {
		if (!fullBlock.pubkeys) {
			throw new Error('pubkeys are required')
		}
		await rollup.postRegistrationBlock(
			fullBlock.signature.txTreeRoot,
			fullBlock.signature.senderFlag,
			fullBlock.signature.aggPubkey,
			fullBlock.signature.aggSignature,
			fullBlock.signature.messagePoint,
			fullBlock.pubkeys,
		)
	} else {
		if (!fullBlock.accountIds) {
			throw new Error('accountIds are required')
		}
		await rollup.postNonRegistrationBlock(
			fullBlock.signature.txTreeRoot,
			fullBlock.signature.senderFlag,
			fullBlock.signature.aggPubkey,
			fullBlock.signature.aggSignature,
			fullBlock.signature.messagePoint,
			fullBlock.signature.pubkeyHash,
			fullBlock.accountIds,
		)
	}
}
