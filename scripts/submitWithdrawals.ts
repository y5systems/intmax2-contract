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

  console.log(
    "lastProcessedWithdrawalId",
    (await rollup.getLastProcessedWIthdrawalId()).toString()
  );

  const lastProcessedWithdrawId = 2;
  const tx = await rollup.submitWithdrawals(lastProcessedWithdrawId);
  console.log("tx hash:", tx.hash);
  await tx.wait();
  console.log("Submit withdrawals");

  console.log(
    "lastProcessedWithdrawalId",
    (await rollup.getLastProcessedWIthdrawalId()).toString()
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
