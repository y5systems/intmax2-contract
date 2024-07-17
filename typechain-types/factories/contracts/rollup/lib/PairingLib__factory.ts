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
import type { NonPayableOverrides } from "../../../../common";
import type {
  PairingLib,
  PairingLibInterface,
} from "../../../../contracts/rollup/lib/PairingLib";

const _abi = [
  {
    inputs: [],
    name: "PairingOpCodeFailed",
    type: "error",
  },
] as const;

const _bytecode =
  "0x60566050600b82828239805160001a6073146043577f4e487b7100000000000000000000000000000000000000000000000000000000600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600080fdfea2646970667358221220c503af5ec96644fb6d2280f1a238f5f90a1aa429fdd3a90db24dd6c0a8c5db7064736f6c63430008180033";

type PairingLibConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: PairingLibConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class PairingLib__factory extends ContractFactory {
  constructor(...args: PairingLibConstructorParams) {
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
      PairingLib & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): PairingLib__factory {
    return super.connect(runner) as PairingLib__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): PairingLibInterface {
    return new Interface(_abi) as PairingLibInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): PairingLib {
    return new Contract(address, _abi, runner) as unknown as PairingLib;
  }
}
