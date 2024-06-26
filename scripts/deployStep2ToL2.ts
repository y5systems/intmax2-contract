import { ethers } from "hardhat";
import "dotenv/config";
import contractAddresses from "./contractAddresses.json"
import { saveJsonToFile } from "./utils/saveJsonToFile";

const l2MessengerAddress = "0xBa50f5340FB9F3Bd074bD638c9BE13eCB36E603d";

async function main() {
  const liquidityContractAddress = contractAddresses.liquidity;
  if (!liquidityContractAddress) {
    throw new Error("liquidityContractAddress is not set");
  }

  let blockBuilderRegistryAddress = (contractAddresses as any).blockBuilderRegistry;
  if (!blockBuilderRegistryAddress) {
    const blockBuilderRegistryFactory = await ethers.getContractFactory("BlockBuilderRegistry");
    const blockBuilderRegistry = await blockBuilderRegistryFactory.deploy();
    await blockBuilderRegistry.deployed();
    blockBuilderRegistryAddress = blockBuilderRegistry.address;
    console.log("Block Builder Registry deployed to:", blockBuilderRegistryAddress);

    const newContractAddresses = {
      ...contractAddresses,
      blockBuilderRegistry: blockBuilderRegistry.address,
    }
  
    saveJsonToFile(
      "./scripts/contractAddresses.json",
      JSON.stringify(newContractAddresses, null, 2)
    )
  }

  const rollupFactory = await ethers.getContractFactory("Rollup");
  const rollup = await rollupFactory.deploy(l2MessengerAddress, liquidityContractAddress, blockBuilderRegistryAddress);
  await rollup.deployed();
  console.log("Rollup deployed to:", rollup.address);

  const newContractAddresses = {
    ...contractAddresses,
    rollup: rollup.address,
  }

  saveJsonToFile(
    "./scripts/contractAddresses.json",
    JSON.stringify(newContractAddresses, null, 2)
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
