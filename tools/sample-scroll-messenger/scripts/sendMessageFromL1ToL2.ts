import { ethers } from "hardhat";
import "dotenv/config";
import { l1ContractAddress } from "./contractAddresses.json";

async function main() {
  if (!l1ContractAddress) {
    throw new Error("l1ContractAddress is not set");
  }

  const owner = (await ethers.getSigners())[0].address;
  console.log("owner address", owner);

  const liquidity = await ethers.getContractAt(
    "L1Contract",
    l1ContractAddress
  );

  const greeting = "https://l1.example.com";
  const fee = ethers.utils.parseEther('0.00001');
  const tx = await liquidity.sendMessageToL2(greeting, {
    value: fee,
  });
  console.log("tx hash:", tx.hash);
  await tx.wait();
  console.log("Send message from L1 to L2");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
