// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

library DepositLib {
	/// @dev Represents a leaf in the Deposit tree
	struct Deposit {
		/// @notice Address of the depositor
		address depositor;
		/// @notice Hash of the recipient's intmax2 address and a private salt
		bytes32 recipientSaltHash;
		/// @notice Amount of tokens being deposited
		uint256 amount;
		/// @notice Index of the token being deposited
		uint32 tokenIndex;
		/// @notice Whether the deposit is eligible for mining rewards
		bool isEligible;
	}

	/// @notice Calculates the hash of a Deposit struct
	/// @param deposit The Deposit struct to be hashed
	/// @return bytes32 The calculated hash of the Deposit
	function getHash(Deposit memory deposit) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					deposit.depositor,
					deposit.recipientSaltHash,
					deposit.amount,
					deposit.tokenIndex,
					uint32(deposit.isEligible ? 1 : 0)
				)
			);
	}
}
