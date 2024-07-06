import { ethers } from "hardhat";
import "dotenv/config";
import contractAddresses from "./contractAddresses.json";
import { saveJsonToFile } from "./utils/saveJsonToFile";

async function main() {
  const l1GasPriceOracleFactory = await ethers.getContractFactory("MockL1GasPriceOracle");
  const l1GasPriceOracle = await l1GasPriceOracleFactory.deploy(
    160000
  );
  await l1GasPriceOracle.deployed();
  console.log("MockL1GasPriceOracle deployed to:", l1GasPriceOracle.address);

  const newContractAddresses = {
    ...contractAddresses,
    l1GasPriceOracle: l1GasPriceOracle.address,
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
