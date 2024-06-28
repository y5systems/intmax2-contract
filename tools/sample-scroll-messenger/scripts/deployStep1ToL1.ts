import { ethers } from "hardhat";
import "dotenv/config";
import { saveJsonToFile } from "./utils/saveJsonToFile";

const l1MessengerAddress = "0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A";

async function main() {
  const l1ContractFactory = await ethers.getContractFactory("L1Contract");
  const l1Contract = await l1ContractFactory.deploy(l1MessengerAddress);
  await l1Contract.deployed();
  console.log("L1Contract deployed to:", l1Contract.address);

  const contractAddresses = {
    l1ContractAddress: l1Contract.address,
  }

  saveJsonToFile(
    "./scripts/contractAddresses.json",
    JSON.stringify(contractAddresses, null, 2)
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
