/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IRollup,
  IRollupInterface,
} from "../../../contracts/rollup/IRollup";

const _abi = [
  {
    inputs: [],
    name: "FraudProofAlreadySubmitted",
    type: "error",
  },
  {
    inputs: [],
    name: "FraudProofVerificationFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidBlockBuilder",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidWithdrawalId",
    type: "error",
  },
  {
    inputs: [],
    name: "OnlyLiquidity",
    type: "error",
  },
  {
    inputs: [],
    name: "OnlyScrollMessenger",
    type: "error",
  },
  {
    inputs: [],
    name: "WithdrawalProofVerificationFailed",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint32",
        name: "blockNumber",
        type: "uint32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "blockBuilder",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "challenger",
        type: "address",
      },
    ],
    name: "BlockFraudProofSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "prevBlockHash",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "blockBuilder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "depositTreeRoot",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "signatureHash",
        type: "bytes32",
      },
    ],
    name: "BlockPosted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "depositTreeRoot",
        type: "bytes32",
      },
    ],
    name: "DepositsProcessed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "withdrawalRequest",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "address",
        name: "withdrawalAggregator",
        type: "address",
      },
    ],
    name: "WithdrawRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "startProcessedWithdrawId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "lastProcessedWithdrawId",
        type: "uint256",
      },
    ],
    name: "WithdrawalsSubmitted",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "isRegistrationBlock",
        type: "bool",
      },
      {
        internalType: "bytes32",
        name: "txTreeRoot",
        type: "bytes32",
      },
      {
        internalType: "uint128",
        name: "senderFlags",
        type: "uint128",
      },
      {
        internalType: "bytes32",
        name: "publicKeysHash",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "accountIdsHash",
        type: "bytes32",
      },
      {
        internalType: "uint256[2]",
        name: "aggregatedPublicKey",
        type: "uint256[2]",
      },
      {
        internalType: "uint256[4]",
        name: "aggregatedSignature",
        type: "uint256[4]",
      },
      {
        internalType: "uint256[4]",
        name: "messagePoint",
        type: "uint256[4]",
      },
    ],
    name: "postBlock",
    outputs: [
      {
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "uint32",
            name: "tokenIndex",
            type: "uint32",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "salt",
            type: "bytes32",
          },
        ],
        internalType: "struct IRollup.Withdrawal[]",
        name: "withdrawals",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "bytes32",
            name: "withdrawalTreeRoot",
            type: "bytes32",
          },
          {
            internalType: "address",
            name: "withdrawalAggregator",
            type: "address",
          },
        ],
        internalType: "struct IRollup.WithdrawalProofPublicInputs",
        name: "publicInputs",
        type: "tuple",
      },
      {
        internalType: "bytes",
        name: "proof",
        type: "bytes",
      },
    ],
    name: "postWithdrawalRequests",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "lastProcessedDepositId",
        type: "uint256",
      },
      {
        internalType: "bytes32[]",
        name: "depositHashes",
        type: "bytes32[]",
      },
    ],
    name: "processDeposits",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "blockHash",
            type: "bytes32",
          },
          {
            internalType: "uint32",
            name: "blockNumber",
            type: "uint32",
          },
          {
            internalType: "address",
            name: "blockBuilder",
            type: "address",
          },
          {
            internalType: "address",
            name: "challenger",
            type: "address",
          },
        ],
        internalType: "struct IRollup.FraudProofPublicInputs",
        name: "publicInputs",
        type: "tuple",
      },
      {
        internalType: "bytes",
        name: "proof",
        type: "bytes",
      },
    ],
    name: "submitBlockFraudProof",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "lastProcessedWithdrawId",
        type: "uint256",
      },
    ],
    name: "submitWithdrawals",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class IRollup__factory {
  static readonly abi = _abi;
  static createInterface(): IRollupInterface {
    return new Interface(_abi) as IRollupInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): IRollup {
    return new Contract(address, _abi, runner) as unknown as IRollup;
  }
}
