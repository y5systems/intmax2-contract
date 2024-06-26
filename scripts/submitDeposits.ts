import { ethers } from "hardhat";
import "dotenv/config";
import contractAddresses from "./contractAddresses.json";

async function main() {
  const liquidityContractAddress = contractAddresses.liquidity;
  if (!liquidityContractAddress) {
    throw new Error("liquidityContractAddress is not set");
  }

  const owner = (await ethers.getSigners())[0].address;
  console.log("owner address", owner);

  const liquidity = await ethers.getContractAt(
    "Liquidity",
    liquidityContractAddress
  );

  console.log("lastProcessedDepositId", (await liquidity.getLastProcessedDepositId()).toString());

  const lastProcessedBlockNumber = 2;
  const tx = await liquidity.submitDeposits(lastProcessedBlockNumber);
  console.log("tx hash:", tx.hash);
  await tx.wait();
  console.log("Submit deposit");

  console.log("lastProcessedDepositId", (await liquidity.getLastProcessedDepositId()).toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
