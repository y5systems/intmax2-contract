import { ethers } from "hardhat";
import axios from "axios";
import "dotenv/config";
import { l2ContractAddress } from "./contractAddresses.json";
import { IL1ScrollMessenger } from "../typechain-types";

const l1MessengerAddress = "0x50c7d3e7f7c656493D1D76aaa1a836CedfCBB16A";

async function main() {
  if (!l2ContractAddress) {
    throw new Error("l2ContractAddress is not set");
  }

  const baseUrl = "https://sepolia-api-bridge-v2.scroll.io/api/l2/unclaimed";
  const page = 1;
  const apiUrl = `${baseUrl}/withdrawals?address=${l2ContractAddress}&page_size=10&page=${page}`;
  let results = [];
  try {
    const res = await axios.get(apiUrl);
    console.log("res", res.data);
    if (res.data.data.results.length !== 0) {
      results = res.data.data.results;
    }
  } catch (error) {
    console.error("error");
    return;
  }

  // { errcode: 0, errmsg: '', data: { results: null, total: 0 } }
  // { errcode: 0, errmsg: '', data: { results: [ [Object] ], total: 1 } }
  // results: [
  //   {
  //     hash: '0x7c05d8549b9bd90e099dc76f5f4db1e729d97e6a6ccef80163c617489414439f',
  //     replay_tx_hash: '',
  //     refund_tx_hash: '',
  //     message_hash: '0xcb49c39299a017091d1ceafc8519db5415be0212d770cc1bf5e00437e19523ba',
  //     token_type: 1,
  //     token_ids: [],
  //     token_amounts: [ '0' ],
  //     message_type: 2,
  //     l1_token_address: '',
  //     l2_token_address: '',
  //     block_number: 4718022,
  //     tx_status: 0,
  //     counterpart_chain_tx: { hash: '', block_number: 0 },
  //     claim_info: {
  //       from: '0x8c519B704B3E0D0eCc4EC99e9316f4FEcb381D42',
  //       to: '0xFd536B04E0F7aF7c4732C136a9dD98344d2Aaee3',
  //       value: '0',
  //       nonce: '362813',
  //       message: '0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001668747470733a2f2f6c322e6578616d706c652e636f6d00000000000000000000',
  //       proof: [Object],
  //       claimable: true
  //     },
  //     block_timestamp: 1718544842,
  //     batch_deposit_fee: ''
  //   }
  // ]

  const owner = (await ethers.getSigners())[0].address;
  console.log("owner address", owner);

  const scrollMessenger = await ethers.getContractAt(
    "IL1ScrollMessenger",
    l1MessengerAddress
  );

  for (const { claim_info } of results) {
    console.log("claimInfo", claim_info);
    const { claimable, ...txData } = claim_info;
    if (!claimable) {
      console.log("tx is not claimable");
      continue;
    }
    const tx = await scrollMessenger.relayMessageWithProof(
      txData.from,
      txData.to,
      txData.value,
      txData.nonce,
      txData.message,
      {
        batchHash: Number(txData.proof.batch_index).toString(16), // TODO: what is this?
        merkleProof: txData.proof.merkle_proof,
      } as IL1ScrollMessenger.L2MessageProofStruct
      // { value: fee }
    );

    console.log("tx hash:", tx.hash);
    await tx.wait();
    console.log("Send message from L2 to L1");
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
