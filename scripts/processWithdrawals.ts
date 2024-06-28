import { ethers, network } from "hardhat";
import axios from "axios";
import "dotenv/config";
import contractAddresses from "./contractAddresses.json";
import {
  ScrollMessengerResponse,
  ScrollMessengerResult,
} from "./utils/scrollMessenger";

const l1MessengerAddress = "0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A";

async function main() {
  const rollupContractAddress = contractAddresses.rollup;
  if (!rollupContractAddress) {
    throw new Error("rollupContractAddress is not set");
  }

  if (network.name !== "scroll" && network.name !== "scrollsepolia") {
    const liquidityContractAddress = contractAddresses.liquidity;
    if (!liquidityContractAddress) {
      throw new Error("liquidityContractAddress is not set");
    }

    const liquidity = await ethers.getContractAt(
      "Liquidity",
      liquidityContractAddress
    );
    const withdrawals = [
      {
        recipient: "0x" + "0".repeat(39) + "1",
        tokenIndex: 1,
        amount: 100,
        salt: "0x" + "0".repeat(64),
      },
    ]; // TODO: Get withdrawals from the Rollup contract
    const tx = await liquidity.processWithdrawals(withdrawals);
    console.log("tx hash:", tx.hash);
    await tx.wait();
    console.log("Processed withdrawal");
    return;
  }

  const baseUrl = "https://sepolia-api-bridge-v2.scroll.io/api/l2/unclaimed";
  const page = 1;
  const apiUrl = `${baseUrl}/withdrawals?address=${rollupContractAddress}&page_size=10&page=${page}`;
  let results: ScrollMessengerResult[] = [];
  try {
    const res = await axios.get<ScrollMessengerResponse>(apiUrl);
    if (res.data.data.results == null || res.data.data.results.length === 0) {
      console.error("no results");
      return;
    }

    results = res.data.data.results;
  } catch (error) {
    console.error("fail to get unclaimed messages", error);
    return;
  }

  for (const result of results) {
    const { claim_info: claimInfo } = result;
    if (!claimInfo?.claimable) {
      console.log("tx is not claimable");
      continue;
    }
    const scrollMessenger = await ethers.getContractAt(
      "IL1ScrollMessenger",
      l1MessengerAddress
    );
    const tx = await scrollMessenger.relayMessageWithProof(
      claimInfo.from,
      claimInfo.to,
      claimInfo.value,
      claimInfo.nonce,
      claimInfo.message,
      {
        batchIndex: claimInfo.proof.batch_index,
        merkleProof: claimInfo.proof.merkle_proof,
      }
    );
    console.log("tx hash:", tx.hash);
    await tx.wait();
    console.log("Processed withdrawal");
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
