import { ethers } from "hardhat";
import "dotenv/config";
import { saveJsonToFile } from "./utils/saveJsonToFile";

async function main() {
  const l1MessengerAddress = "0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A";

  const liquidityFactory = await ethers.getContractFactory("Liquidity");
  const liquidity = await liquidityFactory.deploy(l1MessengerAddress);
  await liquidity.deployed();
  console.log("Liquidity deployed to:", liquidity.address);

  const contractAddresses = {
    liquidity: liquidity.address,
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
