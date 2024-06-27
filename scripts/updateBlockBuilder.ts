import { ethers } from "hardhat";
import "dotenv/config";
import contractAddresses from "./contractAddresses.json";

async function main() {
  const registryContractAddress = contractAddresses.blockBuilderRegistry;
  if (!registryContractAddress) {
    throw new Error("registryContractAddress is not set");
  }

  const owner = (await ethers.getSigners())[0].address;
  console.log("owner address", owner);

  const registry = await ethers.getContractAt(
    "BlockBuilderRegistry",
    registryContractAddress
  );

  const url = "https://example.com";
  const tx = await registry.updateBlockBuilder(url, {
    value: "100000000",
  });
  console.log("tx hash:", tx.hash);
  await tx.wait();
  console.log("Update block builder");

  const blockBuilder = await registry.getBlockBuilder(owner);
  const stakeAmount = blockBuilder.stakeAmount;
  console.log("stake amount:", stakeAmount.toString());

  // const tx3 = await rollup.postBlock();
  // console.log("tx hash:", tx3.hash);
  // await tx.wait();
  // console.log("Post block");

  // const blockHash = await rollup.getBlockHash(1);
  // console.log("block hash:", blockHash);

  const tx2 = await registry.stopBlockBuilder();
  console.log("tx hash:", tx2.hash);
  await tx.wait();
  console.log("Stop block builder");

  console.log("Waiting 5 seconds before unstaking...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const tx3 = await registry.unstake();
  console.log("tx hash:", tx3.hash);
  await tx.wait();
  console.log("Stop block builder");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
