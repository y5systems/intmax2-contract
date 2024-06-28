import { ethers } from "hardhat";
import "dotenv/config";
import contractAddresses from "./contractAddresses.json";
import { saveJsonToFile } from "./utils/saveJsonToFile";

const l2MessengerAddress = "0xBa50f5340FB9F3Bd074bD638c9BE13eCB36E603d";

async function main() {
  const l1ContractAddress = contractAddresses.l1ContractAddress;
  if (!l1ContractAddress) {
    throw new Error("l1ContractAddress is not set");
  }

  const l2ContractFactory = await ethers.getContractFactory("L2Contract");
  const l2Contract = await l2ContractFactory.deploy(l2MessengerAddress, l1ContractAddress);
  await l2Contract.deployed();
  console.log("L2Contract deployed to:", l2Contract.address);

  const newContractAddresses = {
    ...contractAddresses,
    l2ContractAddress: l2Contract.address,
  };

  saveJsonToFile(
    "./scripts/contractAddresses.json",
    JSON.stringify(newContractAddresses, null, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
