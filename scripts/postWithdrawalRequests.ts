import { ethers } from "hardhat";
import "dotenv/config";
import contractAddresses from "./contractAddresses.json";

async function main() {
  const rollupContractAddress = contractAddresses.rollup;
  if (!rollupContractAddress) {
    throw new Error("rollupContractAddress is not set");
  }

  const owner = (await ethers.getSigners())[0].address;
  console.log("owner address", owner);

  const rollup = await ethers.getContractAt("Rollup", rollupContractAddress);

  const recipient = owner;
  const abiCoder = new ethers.utils.AbiCoder();
  const withdrawRequests = [
    {
      recipient,
      tokenIndex: 1,
      amount: 100,
    },
  ].map((withdrawRequest) => {
    return ethers.utils.keccak256(
      abiCoder.encode(
        ["address", "uint32", "uint256"],
        [
          withdrawRequest.recipient,
          withdrawRequest.tokenIndex,
          withdrawRequest.amount,
        ]
      )
    );
  });
  console.log("withdrawal request:", withdrawRequests);
  const publicInputs: string[] = [];
  const proof = "0x";
  const tx = await rollup.postWithdrawRequests(
    withdrawRequests,
    publicInputs,
    proof
  );
  console.log("tx hash:", tx.hash);
  await tx.wait();
  console.log("Post withdrawal requests");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
