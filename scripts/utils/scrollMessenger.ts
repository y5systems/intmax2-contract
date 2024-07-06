import { ethers, network } from "hardhat";
import config from "../../hardhat.config";
import { HttpNetworkUserConfig } from "hardhat/types";
import { BigNumberish } from "ethers";
import contractAddresses from "../contractAddresses.json";

const l1GasPriceOracleAddress = "0x5300000000000000000000000000000000000002";

interface ClaimInfo {
  from: string;
  to: string;
  value: string;
  nonce: string;
  message: string;
  proof: {
    batch_index: number;
    merkle_proof: string;
  };
  claimable: boolean;
}

export interface ScrollMessengerResult {
  hash: string;
  replay_tx_hash: string;
  refund_tx_hash: string;
  message_hash: string;
  token_type: number;
  token_ids: any[];
  token_amounts: string[];
  message_type: number;
  l1_token_address: string;
  l2_token_address: string;
  block_number: number;
  tx_status: 0;
  counterpart_chain_tx: { hash: string; block_number: number };
  claim_info: ClaimInfo | null;
  block_timestamp: number;
  batch_deposit_fee: string;
}

export interface ScrollMessengerResponse {
  errcode: number;
  errmsg: string;
  data: {
    results: ScrollMessengerResult[] | null;
    total: number;
  };
}

export const getBaseFeeFromRpcUrl = async (url: string) => {
  const provider = new ethers.providers.JsonRpcProvider(url);
  const feeMethodId = ethers.utils.id("l1BaseFee()").slice(0, 10);
  const callResult = await provider.call({
    to: l1GasPriceOracleAddress,
    data: feeMethodId,
  });
  const baseFee = ethers.BigNumber.from(callResult);

  return baseFee;
};

export const getBaseFee = async () => {
  if (network.name === "sepolia") {
    const url = (
      config.networks?.["scrollsepolia"] as HttpNetworkUserConfig | undefined
    )?.url;
    if (!url) {
      throw new Error("url is not set");
    }

    return getBaseFeeFromRpcUrl(url);
  }

  if (network.name === "ethereum") {
    const url = (
      config.networks?.["scroll"] as HttpNetworkUserConfig | undefined
    )?.url;
    if (!url) {
      throw new Error("url is not set");
    }

    return getBaseFeeFromRpcUrl(url);
  }

  const l1GasPriceOracle = await ethers.getContractAt(
    "IL1GasPriceOracle",
    contractAddresses.l1GasPriceOracle
  );
  const baseFee = await l1GasPriceOracle.l1BaseFee();

  return baseFee;
};

export const getFee = async (gasLimit: BigNumberish) => {
  const baseFee = await getBaseFee();
  const fee = baseFee.mul(gasLimit);
  return fee;
};
