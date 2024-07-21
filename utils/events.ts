import { ethers } from 'hardhat'
import type { SentMessageEvent } from '../typechain-types/@scroll-tech/contracts/libraries/IScrollMessenger'
import { IScrollMessenger__factory } from '../typechain-types'
const scrollMessengerAbi = IScrollMessenger__factory.abi

export async function getLastSentEvent(
	scrollMessengerAddress: string,
	fromAddress: string,
	fromBlock: number,
): Promise<SentMessageEvent.Log> {
	const scrollMessenger = new ethers.Contract(
		scrollMessengerAddress,
		scrollMessengerAbi,
		ethers.provider,
	)
	const events = await scrollMessenger.queryFilter(
		scrollMessenger.filters.SentMessage(fromAddress, null),
		fromBlock,
	)
	const latestEvent = events[
		events.length - 1
	] as unknown as SentMessageEvent.Log
	return latestEvent
}
