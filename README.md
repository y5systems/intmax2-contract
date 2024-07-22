# INTMAX2 Contract Interface

## Environment Variables

- `DEPLOYER_PRIVATE_KEY`: Deployer's private key
- `ANALYZER_PRIVATE_KEY`: Analyzer's private key
- `ALCHEMY_KEY`: Alchemy key

## How to test

### Test locally

```sh
npm run test test/integration.ts
```

### Test on Sepolia & Scroll Sepolia

#### 0. Deploy to Sepolia & Scroll Sepolia

```sh
echo "{}" > ./scripts/data/deployedContracts.json # initialize contract addresses
npx hardhat run ./scripts/deploy/1_deployToL2.ts --network scrollSepolia
npx hardhat run ./scripts/deploy/2_deployToL1.ts --network sepolia
npx hardhat run ./scripts/deploy/3_initializeOnL2.ts --network scrollSepolia
```

#### 1. Deposit on L1 & Relay to L2

```sh
npx hardhat run scripts/e2e/1_deposit.ts --network sepolia
```

#### 2. Withdraw on L2

```sh
npx hardhat run scripts/e2e/2_withdrawal_l2.ts --network scrollSepolia
```

#### 3. Withdraw on L1

This script should be executed after the messaging bridge of scroll is completed. This usually takes a few hours.

```sh
npx hardhat run scripts/e2e/3_withdrawal_l1.ts --network sepolia
```

### lint

```sh
npm run lint
```
