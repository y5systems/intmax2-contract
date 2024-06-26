import { ethers } from "hardhat";
import axios from "axios";
import "dotenv/config";
import contractAddresses from "./contractAddresses.json";

const l1MessengerAddress = "0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A";

async function main() {
  const rollupContractAddress = contractAddresses.rollup;
  if (!rollupContractAddress) {
    throw new Error("rollupContractAddress is not set");
  }

  const baseUrl = "https://sepolia-api-bridge-v2.scroll.io/api";
  const page = 1;
  const apiUrl = `${baseUrl}/claimable?address=${rollupContractAddress}&page_size=10&page=${page}`;
  try {
    const res = await axios.get(apiUrl);
    console.log("res", res);
  } catch (error) {
    console.error("error");
    return;
  }

  // const owner = (await ethers.getSigners())[0].address;
  // console.log("owner address", owner);

  // const scrollMessenger = await ethers.getContractAt(
  //   "IL1ScrollMessenger",
  //   l1MessengerAddress
  // );

  // const greeting = "https://l2.example.com";
  // const fee = ethers.utils.parseEther("0");
  // const tx = await scrollMessenger.relayMessageWithProof(greeting, {
  //   value: fee,
  // });
  // console.log("tx hash:", tx.hash);
  // await tx.wait();
  // console.log("Send message from L2 to L1");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
