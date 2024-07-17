/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../../common";
import type {
  DepositContract,
  DepositContractInterface,
} from "../../../contracts/lib/DepositContract";

const _abi = [
  {
    inputs: [],
    name: "InvalidInitialization",
    type: "error",
  },
  {
    inputs: [],
    name: "MerkleTreeFull",
    type: "error",
  },
  {
    inputs: [],
    name: "NotInitializing",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "version",
        type: "uint64",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    inputs: [],
    name: "depositCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getDepositRoot",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b506103a3806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632dfdf0b51461003b5780633ae0504714610059575b600080fd5b610043610077565b60405161005091906101fe565b60405180910390f35b61006161007d565b60405161006e9190610232565b60405180910390f35b60205481565b60008060405180606001604052806000801b8152602001600063ffffffff1681526020016000815250905060006100b3826100c5565b90506100be81610105565b9250505090565b60008160000151826020015183604001516040516020016100e8939291906102d5565b604051602081830303815290604052805190602001209050919050565b60008082905060006020549050600084905060005b60208110156101d9576001808285901c1603610175576000816020811061014457610143610312565b5b015484604051602001610158929190610341565b6040516020818303038152906040528051906020012093506101a1565b8382604051602001610188929190610341565b6040516020818303038152906040528051906020012093505b81826040516020016101b4929190610341565b604051602081830303815290604052805190602001209150808060010191505061011a565b50829350505050919050565b6000819050919050565b6101f8816101e5565b82525050565b600060208201905061021360008301846101ef565b92915050565b6000819050919050565b61022c81610219565b82525050565b60006020820190506102476000830184610223565b92915050565b6000819050919050565b61026861026382610219565b61024d565b82525050565b600063ffffffff82169050919050565b60008160e01b9050919050565b60006102968261027e565b9050919050565b6102ae6102a98261026e565b61028b565b82525050565b6000819050919050565b6102cf6102ca826101e5565b6102b4565b82525050565b60006102e18286610257565b6020820191506102f1828561029d565b60048201915061030182846102be565b602082019150819050949350505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b600061034d8285610257565b60208201915061035d8284610257565b602082019150819050939250505056fea2646970667358221220e6413cb01fef67efb8a39a602fbeee506aa12a14aba6cea07bb778d36149d5b964736f6c63430008180033";

type DepositContractConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: DepositContractConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class DepositContract__factory extends ContractFactory {
  constructor(...args: DepositContractConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      DepositContract & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): DepositContract__factory {
    return super.connect(runner) as DepositContract__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): DepositContractInterface {
    return new Interface(_abi) as DepositContractInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): DepositContract {
    return new Contract(address, _abi, runner) as unknown as DepositContract;
  }
}
