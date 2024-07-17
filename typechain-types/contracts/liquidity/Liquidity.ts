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
} from "../../common";

export declare namespace IRollup {
  export type WithdrawalStruct = {
    recipient: AddressLike;
    tokenIndex: BigNumberish;
    amount: BigNumberish;
    salt: BytesLike;
    blockHash: BytesLike;
  };

  export type WithdrawalStructOutput = [
    recipient: string,
    tokenIndex: bigint,
    amount: bigint,
    salt: string,
    blockHash: string
  ] & {
    recipient: string;
    tokenIndex: bigint;
    amount: bigint;
    salt: string;
    blockHash: string;
  };
}

export declare namespace DepositLib {
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
}

export interface LiquidityInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "UPGRADE_INTERFACE_VERSION"
      | "__TokenInfo_init"
      | "cancelPendingDeposit"
      | "claimRejectedDeposit"
      | "claimWithdrawals"
      | "depositERC1155"
      | "depositERC20"
      | "depositERC721"
      | "depositETH"
      | "initialize"
      | "lastAnalyzedDepositId"
      | "lastProcessedDepositId"
      | "owner"
      | "pendingDepositData"
      | "processWithdrawals"
      | "proxiableUUID"
      | "rejectDeposits"
      | "renounceOwnership"
      | "submitDeposits"
      | "transferOwnership"
      | "upgradeToAndCall"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "DepositCanceled"
      | "Deposited"
      | "DepositsRejected"
      | "DepositsSubmitted"
      | "Initialized"
      | "OwnershipTransferred"
      | "Upgraded"
      | "WithdrawalClaimable"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "UPGRADE_INTERFACE_VERSION",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "__TokenInfo_init",
    values: [AddressLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "cancelPendingDeposit",
    values: [BigNumberish, DepositLib.DepositStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "claimRejectedDeposit",
    values: [BigNumberish, DepositLib.DepositStruct]
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
    functionFragment: "initialize",
    values: [AddressLike, AddressLike, AddressLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "lastAnalyzedDepositId",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "lastProcessedDepositId",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "pendingDepositData",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "processWithdrawals",
    values: [IRollup.WithdrawalStruct[]]
  ): string;
  encodeFunctionData(
    functionFragment: "proxiableUUID",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "rejectDeposits",
    values: [BigNumberish, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "submitDeposits",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "upgradeToAndCall",
    values: [AddressLike, BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "UPGRADE_INTERFACE_VERSION",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "__TokenInfo_init",
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
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "lastAnalyzedDepositId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "lastProcessedDepositId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "pendingDepositData",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "processWithdrawals",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "proxiableUUID",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "rejectDeposits",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "submitDeposits",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "upgradeToAndCall",
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

export namespace InitializedEvent {
  export type InputTuple = [version: BigNumberish];
  export type OutputTuple = [version: bigint];
  export interface OutputObject {
    version: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace OwnershipTransferredEvent {
  export type InputTuple = [previousOwner: AddressLike, newOwner: AddressLike];
  export type OutputTuple = [previousOwner: string, newOwner: string];
  export interface OutputObject {
    previousOwner: string;
    newOwner: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace UpgradedEvent {
  export type InputTuple = [implementation: AddressLike];
  export type OutputTuple = [implementation: string];
  export interface OutputObject {
    implementation: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace WithdrawalClaimableEvent {
  export type InputTuple = [
    withdrawalId: BigNumberish,
    withdrawal: IRollup.WithdrawalStruct
  ];
  export type OutputTuple = [
    withdrawalId: bigint,
    withdrawal: IRollup.WithdrawalStructOutput
  ];
  export interface OutputObject {
    withdrawalId: bigint;
    withdrawal: IRollup.WithdrawalStructOutput;
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

  UPGRADE_INTERFACE_VERSION: TypedContractMethod<[], [string], "view">;

  __TokenInfo_init: TypedContractMethod<
    [_usdc: AddressLike, _wbtc: AddressLike],
    [void],
    "nonpayable"
  >;

  cancelPendingDeposit: TypedContractMethod<
    [depositId: BigNumberish, deposit: DepositLib.DepositStruct],
    [void],
    "nonpayable"
  >;

  claimRejectedDeposit: TypedContractMethod<
    [depositId: BigNumberish, deposit: DepositLib.DepositStruct],
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

  initialize: TypedContractMethod<
    [
      _l1ScrollMessenger: AddressLike,
      _rollup: AddressLike,
      _usdc: AddressLike,
      _wbtc: AddressLike
    ],
    [void],
    "nonpayable"
  >;

  lastAnalyzedDepositId: TypedContractMethod<[], [bigint], "view">;

  lastProcessedDepositId: TypedContractMethod<[], [bigint], "view">;

  owner: TypedContractMethod<[], [string], "view">;

  pendingDepositData: TypedContractMethod<
    [arg0: BigNumberish],
    [[string, string] & { depositHash: string; sender: string }],
    "view"
  >;

  processWithdrawals: TypedContractMethod<
    [withdrawals: IRollup.WithdrawalStruct[]],
    [void],
    "nonpayable"
  >;

  proxiableUUID: TypedContractMethod<[], [string], "view">;

  rejectDeposits: TypedContractMethod<
    [_lastAnalyzedDepositId: BigNumberish, rejectedDepositIds: BigNumberish[]],
    [void],
    "nonpayable"
  >;

  renounceOwnership: TypedContractMethod<[], [void], "nonpayable">;

  submitDeposits: TypedContractMethod<
    [_lastProcessedDepositId: BigNumberish],
    [void],
    "payable"
  >;

  transferOwnership: TypedContractMethod<
    [newOwner: AddressLike],
    [void],
    "nonpayable"
  >;

  upgradeToAndCall: TypedContractMethod<
    [newImplementation: AddressLike, data: BytesLike],
    [void],
    "payable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "UPGRADE_INTERFACE_VERSION"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "__TokenInfo_init"
  ): TypedContractMethod<
    [_usdc: AddressLike, _wbtc: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "cancelPendingDeposit"
  ): TypedContractMethod<
    [depositId: BigNumberish, deposit: DepositLib.DepositStruct],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "claimRejectedDeposit"
  ): TypedContractMethod<
    [depositId: BigNumberish, deposit: DepositLib.DepositStruct],
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
    nameOrSignature: "initialize"
  ): TypedContractMethod<
    [
      _l1ScrollMessenger: AddressLike,
      _rollup: AddressLike,
      _usdc: AddressLike,
      _wbtc: AddressLike
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "lastAnalyzedDepositId"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "lastProcessedDepositId"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "owner"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "pendingDepositData"
  ): TypedContractMethod<
    [arg0: BigNumberish],
    [[string, string] & { depositHash: string; sender: string }],
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
    nameOrSignature: "proxiableUUID"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "rejectDeposits"
  ): TypedContractMethod<
    [_lastAnalyzedDepositId: BigNumberish, rejectedDepositIds: BigNumberish[]],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "renounceOwnership"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "submitDeposits"
  ): TypedContractMethod<
    [_lastProcessedDepositId: BigNumberish],
    [void],
    "payable"
  >;
  getFunction(
    nameOrSignature: "transferOwnership"
  ): TypedContractMethod<[newOwner: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "upgradeToAndCall"
  ): TypedContractMethod<
    [newImplementation: AddressLike, data: BytesLike],
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
  getEvent(
    key: "Initialized"
  ): TypedContractEvent<
    InitializedEvent.InputTuple,
    InitializedEvent.OutputTuple,
    InitializedEvent.OutputObject
  >;
  getEvent(
    key: "OwnershipTransferred"
  ): TypedContractEvent<
    OwnershipTransferredEvent.InputTuple,
    OwnershipTransferredEvent.OutputTuple,
    OwnershipTransferredEvent.OutputObject
  >;
  getEvent(
    key: "Upgraded"
  ): TypedContractEvent<
    UpgradedEvent.InputTuple,
    UpgradedEvent.OutputTuple,
    UpgradedEvent.OutputObject
  >;
  getEvent(
    key: "WithdrawalClaimable"
  ): TypedContractEvent<
    WithdrawalClaimableEvent.InputTuple,
    WithdrawalClaimableEvent.OutputTuple,
    WithdrawalClaimableEvent.OutputObject
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

    "Initialized(uint64)": TypedContractEvent<
      InitializedEvent.InputTuple,
      InitializedEvent.OutputTuple,
      InitializedEvent.OutputObject
    >;
    Initialized: TypedContractEvent<
      InitializedEvent.InputTuple,
      InitializedEvent.OutputTuple,
      InitializedEvent.OutputObject
    >;

    "OwnershipTransferred(address,address)": TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;
    OwnershipTransferred: TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;

    "Upgraded(address)": TypedContractEvent<
      UpgradedEvent.InputTuple,
      UpgradedEvent.OutputTuple,
      UpgradedEvent.OutputObject
    >;
    Upgraded: TypedContractEvent<
      UpgradedEvent.InputTuple,
      UpgradedEvent.OutputTuple,
      UpgradedEvent.OutputObject
    >;

    "WithdrawalClaimable(uint256,tuple)": TypedContractEvent<
      WithdrawalClaimableEvent.InputTuple,
      WithdrawalClaimableEvent.OutputTuple,
      WithdrawalClaimableEvent.OutputObject
    >;
    WithdrawalClaimable: TypedContractEvent<
      WithdrawalClaimableEvent.InputTuple,
      WithdrawalClaimableEvent.OutputTuple,
      WithdrawalClaimableEvent.OutputObject
    >;
  };
}
