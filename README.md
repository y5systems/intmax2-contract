# INTMAX2 Contract Interface

## Environment Variables

- `PRIVATE_KEY`: User's private key
- `ALCHEMY_KEY`: Alchemy key

## How to run

### Run Rollup Test

```sh
npm i
npx hardhat node &
npx hardhat run ./scripts/deployStep2ToL2.ts --network localhost
npx hardhat run ./scripts/simpleRollupTest.ts --network localhost
```

## Deploying to Scroll & Scroll Sepolia (TODO)

You must own ETH in the Sepolia and Scroll Sepolia networks respectively.

```sh
npm i
npm run deploy
```

### Send message from L1 to L2

```sh
npm run send-message-from-l1
```

### Send message from L2 to L1

```sh
npm run send-message-from-l2
npm run relay-message-from-l2
```

### lint
    
```sh
npm run lint
```