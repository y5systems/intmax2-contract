import { ethers } from "hardhat";
import "dotenv/config";
import contractAddresses from "./contractAddresses.json";

async function main() {
  const rollupContractAddress = contractAddresses.rollup;
  if (!rollupContractAddress) {
    throw new Error("rollupContractAddress is not set");
  }

  const ownerAccount = (await ethers.getSigners())[0];
  const owner = ownerAccount.address;
  console.log("owner address", owner);
  console.log(ethers.provider.getTransactionCount(owner))

  const rollup = await ethers.getContractAt("Rollup", rollupContractAddress);

  const recipient = owner;
  const withdrawRequests = [
    {
      recipient,
      tokenIndex: 1,
      amount: 100,
      salt: "0x" + "0".repeat(64),
    },
  ];
  console.log("withdrawal request:", withdrawRequests);
  const publicInputs: string[] = [];
  const proof = "0x";
  const tx = await rollup.postWithdrawalRequests(
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
