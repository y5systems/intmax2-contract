import { ethers } from "hardhat";
import "dotenv/config";
import contractAddresses from "./contractAddresses.json";

async function main() {
  const liquidityContractAddress = contractAddresses.liquidity;
  if (!liquidityContractAddress) {
    throw new Error("liquidityContractAddress is not set");
  }

  const rollupContractAddress = contractAddresses.rollup;
  if (!rollupContractAddress) {
    throw new Error("rollupContractAddress is not set");
  }

  if (!rollupContractAddress) {
    throw new Error("rollupContractAddress is not set");
  }

  const owner = (await ethers.getSigners())[0].address;
  console.log("owner address", owner);

  const rollup = await ethers.getContractAt(
    "Rollup",
    rollupContractAddress
  );

  const greeting = "https://l2.example.com";
  const fee = ethers.utils.parseEther("0");
  const tx = await rollup.sendMessageToL1(greeting, {
    value: fee,
  });
  console.log("tx hash:", tx.hash);
  await tx.wait();
  console.log("Send message from L2 to L1");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
