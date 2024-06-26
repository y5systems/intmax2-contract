import { ethers } from "hardhat";
import "dotenv/config";
import contractAddresses from "./contractAddresses.json";
import { ILiquidity, Liquidity } from "../typechain-types";

const getLatestDepositEvent = async (liquidity: ILiquidity | Liquidity, sender: string) => {
  // fetch the latest deposit event for the owner
  const depositEvents = await liquidity.queryFilter(
    liquidity.filters.Deposited(null, sender)
  );
  const depositEventResult = depositEvents.pop();
  if (!depositEventResult) {
    throw new Error("depositEvent is not set");
  }
  const deposit = depositEventResult?.args;
  if (!deposit) {
    throw new Error("deposit is not set");
  }
  const depositId = deposit.depositId;
  if (!depositId) {
    throw new Error("depositId is not set");
  }

  return depositEventResult;
};

async function main() {
  const liquidityContractAddress = contractAddresses.liquidity;
  if (!liquidityContractAddress) {
    throw new Error("liquidityContractAddress is not set");
  }

  const owner = (await ethers.getSigners())[0].address;
  console.log("owner address", owner);

  const liquidity = await ethers.getContractAt(
    "Liquidity",
    liquidityContractAddress
  );

  const tokenAddress = "0x" + "0".repeat(39) + "1";
  const recipient = "0x" + "0".repeat(64);
  const amount = "1000000";
  const tx = await liquidity.depositERC20(tokenAddress, recipient, amount);
  console.log("tx hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Deposited ETH");

  // get the deposit index
  const depositEvent = receipt.events?.[0];
  console.log("deposit event:", depositEvent);
  const depositEventResult = depositEvent?.args;
  if (!depositEventResult) {
    throw new Error("deposit is not set");
  }

  // const depositEventResult = await getLatestDepositEvent(liquidity, owner);

  const depositId = depositEventResult.depositId;
  if (!depositId) {
    throw new Error("depositId is not set");
  }

  const depositData = {
    recipientSaltHash: depositEventResult.recipientSaltData,
    tokenIndex: depositEventResult.tokenIndex,
    amount: depositEventResult.amount,
  };

  // cancel the deposit
  const tx2 = await liquidity.cancelPendingDeposit(depositId, depositData);
  console.log("tx hash:", tx2.hash);
  await tx2.wait();
  console.log("Cancelled deposit");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
