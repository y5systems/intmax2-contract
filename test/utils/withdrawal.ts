import fs from 'fs'

export function loadWithdrawalInfo(): WithdrawalInfo {
	const data = fs.readFileSync(`test_data/withdrawal_info.json`, 'utf8')
	const jsonData = JSON.parse(data) as WithdrawalInfo
	return jsonData
}
