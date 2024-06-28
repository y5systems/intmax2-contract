# Dummy Rollup Contract

## Environment Variables

- `PRIVATE_KEY`: User's private key
- `ALCHEMY_KEY`: Alchemy key

## How to run

You must own ETH in the Sepolia and Scroll Sepolia networks respectively.

### Deploying to Scroll & Scroll Sepolia

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
# about 2 hours later
npm run relay-message-from-l2
```
