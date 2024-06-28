import { ethers, network } from "hardhat";
import "dotenv/config";
import contractAddresses from "./contractAddresses.json";
import { getFee } from "./utils/scrollMessenger";
import { calcRecipientSaltHash } from "./utils/hash";

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

  console.log("balance", (await ethers.provider.getBalance(owner)).toString());

  const lastAnalyzedDepositId = await liquidity.getLastAnalyzedDepositId();
  const gasLimit = await liquidity.estimateGas.submitDeposits(
    lastAnalyzedDepositId,
    {
      value: ethers.provider.getBalance(owner),
    }
  );
  const fee = await getFee(gasLimit);
  // const fee = ethers.utils.parseEther('0.00001');
  console.log("fee:", ethers.utils.formatEther(fee), "ETH");
  const tx = await liquidity.submitDeposits(lastAnalyzedDepositId, {
    value: fee,
  });
  console.log("tx hash:", tx.hash);
  await tx.wait();
  console.log("Submit deposits");

  console.log("balance", (await ethers.provider.getBalance(owner)).toString());

  if (network.name !== "scroll" && network.name !== "scrollsepolia") {
    const rollupContractAddress = contractAddresses.rollup;
    const rollup = await ethers.getContractAt("Rollup", rollupContractAddress);

    const recipient = "0x" + "0".repeat(63) + "1";
    const salt = "0x" + "0".repeat(63) + "1";
    const recipientSaltHash = calcRecipientSaltHash(recipient, salt);
    const deposits = [
      {
        recipientSaltHash: recipientSaltHash,
        tokenIndex: 1,
        amount: 100,
      },
    ]; // TODO: Get withdrawals from the Rollup contract
    const tx2 = await rollup.processDeposits(deposits);
    console.log("tx hash:", tx2.hash);
    await tx2.wait();
    console.log("Process deposits");

    console.log(
      "deposit tree root",
      (await rollup.getDepositTreeRoot()).toString()
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
