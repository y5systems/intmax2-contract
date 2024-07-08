/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../common";

export declare namespace ILiquidity {
  export type DepositStruct = {
    recipientSaltHash: BytesLike;
    tokenIndex: BigNumberish;
    amount: BigNumberish;
  };

  export type DepositStructOutput = [
    recipientSaltHash: string,
    tokenIndex: bigint,
    amount: bigint
  ] & { recipientSaltHash: string; tokenIndex: bigint; amount: bigint };

  export type DepositDataStruct = {
    depositHash: BytesLike;
    sender: AddressLike;
    requestedAt: BigNumberish;
  };

  export type DepositDataStructOutput = [
    depositHash: string,
    sender: string,
    requestedAt: bigint
  ] & { depositHash: string; sender: string; requestedAt: bigint };

  export type TokenInfoStruct = {
    tokenType: BigNumberish;
    tokenAddress: AddressLike;
    tokenId: BigNumberish;
  };

  export type TokenInfoStructOutput = [
    tokenType: bigint,
    tokenAddress: string,
    tokenId: bigint
  ] & { tokenType: bigint; tokenAddress: string; tokenId: bigint };
}

export declare namespace IRollup {
  export type WithdrawalStruct = {
    recipient: AddressLike;
    tokenIndex: BigNumberish;
    amount: BigNumberish;
    salt: BytesLike;
  };

  export type WithdrawalStructOutput = [
    recipient: string,
    tokenIndex: bigint,
    amount: bigint,
    salt: string
  ] & { recipient: string; tokenIndex: bigint; amount: bigint; salt: string };
}

export interface LiquidityInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "_rollupContract"
      | "_scrollMessenger"
      | "cancelPendingDeposit"
      | "claimRejectedDeposit"
      | "claimWithdrawals"
      | "depositERC1155"
      | "depositERC20"
      | "depositERC721"
      | "depositETH"
      | "getDepositCounter"
      | "getLastAnalyzedDepositId"
      | "getLastProcessedDepositId"
      | "getPendingDeposit"
      | "getRejectedDeposit"
      | "getTokenIndex"
      | "getTokenInfo"
      | "processWithdrawals"
      | "rejectDeposits"
      | "submitDeposits"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "DepositCanceled"
      | "Deposited"
      | "DepositsRejected"
      | "DepositsSubmitted"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "_rollupContract",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "_scrollMessenger",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "cancelPendingDeposit",
    values: [BigNumberish, ILiquidity.DepositStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "claimRejectedDeposit",
    values: [BigNumberish, ILiquidity.DepositStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "claimWithdrawals",
    values: [BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "depositERC1155",
    values: [AddressLike, BytesLike, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "depositERC20",
    values: [AddressLike, BytesLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "depositERC721",
    values: [AddressLike, BytesLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "depositETH",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getDepositCounter",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getLastAnalyzedDepositId",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getLastProcessedDepositId",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getPendingDeposit",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getRejectedDeposit",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getTokenIndex",
    values: [BigNumberish, AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getTokenInfo",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "processWithdrawals",
    values: [IRollup.WithdrawalStruct[]]
  ): string;
  encodeFunctionData(
    functionFragment: "rejectDeposits",
    values: [BigNumberish, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "submitDeposits",
    values: [BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "_rollupContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "_scrollMessenger",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "cancelPendingDeposit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "claimRejectedDeposit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "claimWithdrawals",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "depositERC1155",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "depositERC20",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "depositERC721",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "depositETH", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getDepositCounter",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getLastAnalyzedDepositId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getLastProcessedDepositId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getPendingDeposit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRejectedDeposit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTokenIndex",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTokenInfo",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "processWithdrawals",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "rejectDeposits",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "submitDeposits",
    data: BytesLike
  ): Result;
}

export namespace DepositCanceledEvent {
  export type InputTuple = [depositId: BigNumberish];
  export type OutputTuple = [depositId: bigint];
  export interface OutputObject {
    depositId: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace DepositedEvent {
  export type InputTuple = [
    depositId: BigNumberish,
    sender: AddressLike,
    recipientSaltHash: BytesLike,
    tokenIndex: BigNumberish,
    amount: BigNumberish,
    requestedAt: BigNumberish
  ];
  export type OutputTuple = [
    depositId: bigint,
    sender: string,
    recipientSaltHash: string,
    tokenIndex: bigint,
    amount: bigint,
    requestedAt: bigint
  ];
  export interface OutputObject {
    depositId: bigint;
    sender: string;
    recipientSaltHash: string;
    tokenIndex: bigint;
    amount: bigint;
    requestedAt: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace DepositsRejectedEvent {
  export type InputTuple = [lastAnalyzedDepositId: BigNumberish];
  export type OutputTuple = [lastAnalyzedDepositId: bigint];
  export interface OutputObject {
    lastAnalyzedDepositId: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace DepositsSubmittedEvent {
  export type InputTuple = [lastProcessedDepositId: BigNumberish];
  export type OutputTuple = [lastProcessedDepositId: bigint];
  export interface OutputObject {
    lastProcessedDepositId: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface Liquidity extends BaseContract {
  connect(runner?: ContractRunner | null): Liquidity;
  waitForDeployment(): Promise<this>;

  interface: LiquidityInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  _rollupContract: TypedContractMethod<[], [string], "view">;

  _scrollMessenger: TypedContractMethod<[], [string], "view">;

  cancelPendingDeposit: TypedContractMethod<
    [depositId: BigNumberish, deposit: ILiquidity.DepositStruct],
    [void],
    "nonpayable"
  >;

  claimRejectedDeposit: TypedContractMethod<
    [depositId: BigNumberish, deposit: ILiquidity.DepositStruct],
    [void],
    "nonpayable"
  >;

  claimWithdrawals: TypedContractMethod<
    [withdrawalIds: BigNumberish[]],
    [void],
    "nonpayable"
  >;

  depositERC1155: TypedContractMethod<
    [
      tokenAddress: AddressLike,
      recipientSaltHash: BytesLike,
      tokenId: BigNumberish,
      amount: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  depositERC20: TypedContractMethod<
    [
      tokenAddress: AddressLike,
      recipientSaltHash: BytesLike,
      amount: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  depositERC721: TypedContractMethod<
    [
      tokenAddress: AddressLike,
      recipientSaltHash: BytesLike,
      tokenId: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  depositETH: TypedContractMethod<
    [recipientSaltHash: BytesLike],
    [void],
    "payable"
  >;

  getDepositCounter: TypedContractMethod<[], [bigint], "view">;

  getLastAnalyzedDepositId: TypedContractMethod<[], [bigint], "view">;

  getLastProcessedDepositId: TypedContractMethod<[], [bigint], "view">;

  getPendingDeposit: TypedContractMethod<
    [depositId: BigNumberish],
    [ILiquidity.DepositDataStructOutput],
    "view"
  >;

  getRejectedDeposit: TypedContractMethod<
    [depositId: BigNumberish],
    [ILiquidity.DepositDataStructOutput],
    "view"
  >;

  getTokenIndex: TypedContractMethod<
    [tokenType: BigNumberish, tokenAddress: AddressLike, tokenId: BigNumberish],
    [bigint],
    "view"
  >;

  getTokenInfo: TypedContractMethod<
    [tokenIndex: BigNumberish],
    [ILiquidity.TokenInfoStructOutput],
    "view"
  >;

  processWithdrawals: TypedContractMethod<
    [withdrawals: IRollup.WithdrawalStruct[]],
    [void],
    "nonpayable"
  >;

  rejectDeposits: TypedContractMethod<
    [lastAnalyzedDepositId: BigNumberish, rejectedDepositIds: BigNumberish[]],
    [void],
    "nonpayable"
  >;

  submitDeposits: TypedContractMethod<
    [lastProcessedDepositId: BigNumberish],
    [void],
    "payable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "_rollupContract"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "_scrollMessenger"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "cancelPendingDeposit"
  ): TypedContractMethod<
    [depositId: BigNumberish, deposit: ILiquidity.DepositStruct],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "claimRejectedDeposit"
  ): TypedContractMethod<
    [depositId: BigNumberish, deposit: ILiquidity.DepositStruct],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "claimWithdrawals"
  ): TypedContractMethod<[withdrawalIds: BigNumberish[]], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "depositERC1155"
  ): TypedContractMethod<
    [
      tokenAddress: AddressLike,
      recipientSaltHash: BytesLike,
      tokenId: BigNumberish,
      amount: BigNumberish
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "depositERC20"
  ): TypedContractMethod<
    [
      tokenAddress: AddressLike,
      recipientSaltHash: BytesLike,
      amount: BigNumberish
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "depositERC721"
  ): TypedContractMethod<
    [
      tokenAddress: AddressLike,
      recipientSaltHash: BytesLike,
      tokenId: BigNumberish
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "depositETH"
  ): TypedContractMethod<[recipientSaltHash: BytesLike], [void], "payable">;
  getFunction(
    nameOrSignature: "getDepositCounter"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "getLastAnalyzedDepositId"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "getLastProcessedDepositId"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "getPendingDeposit"
  ): TypedContractMethod<
    [depositId: BigNumberish],
    [ILiquidity.DepositDataStructOutput],
    "view"
  >;
  getFunction(
    nameOrSignature: "getRejectedDeposit"
  ): TypedContractMethod<
    [depositId: BigNumberish],
    [ILiquidity.DepositDataStructOutput],
    "view"
  >;
  getFunction(
    nameOrSignature: "getTokenIndex"
  ): TypedContractMethod<
    [tokenType: BigNumberish, tokenAddress: AddressLike, tokenId: BigNumberish],
    [bigint],
    "view"
  >;
  getFunction(
    nameOrSignature: "getTokenInfo"
  ): TypedContractMethod<
    [tokenIndex: BigNumberish],
    [ILiquidity.TokenInfoStructOutput],
    "view"
  >;
  getFunction(
    nameOrSignature: "processWithdrawals"
  ): TypedContractMethod<
    [withdrawals: IRollup.WithdrawalStruct[]],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "rejectDeposits"
  ): TypedContractMethod<
    [lastAnalyzedDepositId: BigNumberish, rejectedDepositIds: BigNumberish[]],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "submitDeposits"
  ): TypedContractMethod<
    [lastProcessedDepositId: BigNumberish],
    [void],
    "payable"
  >;

  getEvent(
    key: "DepositCanceled"
  ): TypedContractEvent<
    DepositCanceledEvent.InputTuple,
    DepositCanceledEvent.OutputTuple,
    DepositCanceledEvent.OutputObject
  >;
  getEvent(
    key: "Deposited"
  ): TypedContractEvent<
    DepositedEvent.InputTuple,
    DepositedEvent.OutputTuple,
    DepositedEvent.OutputObject
  >;
  getEvent(
    key: "DepositsRejected"
  ): TypedContractEvent<
    DepositsRejectedEvent.InputTuple,
    DepositsRejectedEvent.OutputTuple,
    DepositsRejectedEvent.OutputObject
  >;
  getEvent(
    key: "DepositsSubmitted"
  ): TypedContractEvent<
    DepositsSubmittedEvent.InputTuple,
    DepositsSubmittedEvent.OutputTuple,
    DepositsSubmittedEvent.OutputObject
  >;

  filters: {
    "DepositCanceled(uint256)": TypedContractEvent<
      DepositCanceledEvent.InputTuple,
      DepositCanceledEvent.OutputTuple,
      DepositCanceledEvent.OutputObject
    >;
    DepositCanceled: TypedContractEvent<
      DepositCanceledEvent.InputTuple,
      DepositCanceledEvent.OutputTuple,
      DepositCanceledEvent.OutputObject
    >;

    "Deposited(uint256,address,bytes32,uint32,uint256,uint256)": TypedContractEvent<
      DepositedEvent.InputTuple,
      DepositedEvent.OutputTuple,
      DepositedEvent.OutputObject
    >;
    Deposited: TypedContractEvent<
      DepositedEvent.InputTuple,
      DepositedEvent.OutputTuple,
      DepositedEvent.OutputObject
    >;

    "DepositsRejected(uint256)": TypedContractEvent<
      DepositsRejectedEvent.InputTuple,
      DepositsRejectedEvent.OutputTuple,
      DepositsRejectedEvent.OutputObject
    >;
    DepositsRejected: TypedContractEvent<
      DepositsRejectedEvent.InputTuple,
      DepositsRejectedEvent.OutputTuple,
      DepositsRejectedEvent.OutputObject
    >;

    "DepositsSubmitted(uint256)": TypedContractEvent<
      DepositsSubmittedEvent.InputTuple,
      DepositsSubmittedEvent.OutputTuple,
      DepositsSubmittedEvent.OutputObject
    >;
    DepositsSubmitted: TypedContractEvent<
      DepositsSubmittedEvent.InputTuple,
      DepositsSubmittedEvent.OutputTuple,
      DepositsSubmittedEvent.OutputObject
    >;
  };
}
