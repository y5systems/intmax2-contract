// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ChainedClaimLib} from "../../../claim/lib/ChainedClaimLib.sol";

contract ChainedClaimLibTest {
	function verifyWithdrawalChain(
		ChainedClaimLib.ChainedClaim[] memory claims,
		bytes32 lastClaimHash
	) external pure returns (bool) {
		return ChainedClaimLib.verifyClaimChain(claims, lastClaimHash);
	}
}
