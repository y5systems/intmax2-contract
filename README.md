# INTMAX2 Contract Interface

## Environment Variables

- `PRIVATE_KEY`: User's private key
- `ALCHEMY_KEY`: Alchemy key

## How to run

### Deploy to Sepolia & Scroll Sepolia

```sh
npm i
npx hardhat node
```

Open a new terminal and run the following commands:

```sh
echo "{}" > ./scripts/deployedContracts.json # initialize contract addresses
npx hardhat run ./scripts/deployStep1ToL2.ts --network scrollSepolia
npx hardhat run ./scripts/deployStep2ToL1.ts --network sepolia
npx hardhat run ./scripts/deployStep3ToL2.ts --network scrollSepolia
```

## How to test

### test locally

`npm run test test/integration.ts`

### test on Sepolia & Scroll Sepolia

#### Deposit on L1 & Relay to L2

`npx hardhat run scripts/test/1_deposit.ts --network sepolia`

#### Withdraw on L2

`npx hardhat run scripts/test/2_withdrawal_l2.ts --network scrollSepolia`

#### Withdraw on L1

You need to hardcode the relay merkle proof in `scripts/test/3_withdrawal_l1.ts` before running the following command.

`npx hardhat run scripts/test/3_withdrawal_l1.ts --network sepolia`

### lint

```sh
npm run lint
```
