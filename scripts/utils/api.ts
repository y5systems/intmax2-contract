import axios from 'axios'
import { ScrollApiResponse, ScrollApiResponseSchema } from '../schema/scrollApi'
import { z } from 'zod'

export async function fetchUnclaimedWithdrawals(
	address: string,
	pageSize: number = 10,
	page: number = 1,
): Promise<ScrollApiResponse> {
	const apiUrl = `https://sepolia-api-bridge-v2.scroll.io/api/l2/unclaimed/withdrawals`

	try {
		const response = await axios.get(apiUrl, {
			params: {
				page_size: pageSize,
				page: page,
				address: address,
			},
		})
		const validatedData = ScrollApiResponseSchema.parse(response.data)
		return validatedData
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('Validation error:', error.errors)
		} else if (axios.isAxiosError(error)) {
			console.error('API request failed:', error.message)
		} else {
			console.error('An unexpected error occurred:', error)
		}
		throw error
	}
}
