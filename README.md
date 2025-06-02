# Stargaze to Cosmos Address Converter

A simple utility to convert Stargaze (stars) addresses to Cosmos Hub (cosmos) addresses and check their balances.

## Installation

```bash
npm install
```

## Usage

### Converting Addresses

1. Create a file named `wallets.csv` with Stargaze addresses. The addresses should be in the first column.

Example `wallets.csv`:
```
StargazeAddress
stars1abcdefghijklmnopqrstuvwxyz0123456
stars1zyxwvutsrqponmlkjihgfedcba9876543
```

2. Run the conversion:

```bash
npm start
```

3. Find the converted addresses in `output.csv`.

### Checking Balances on Cosmos Hub

After converting addresses, you can check their balances on Cosmos Hub:

```bash
npm run check-balances
```

This will:
1. Read the converted addresses from `output.csv`
2. Check the balance of each Cosmos Hub address
3. Create a new file called `hub.csv` with Stargaze addresses, Cosmos Hub addresses, and their balances
4. Addresses with zero balance will be included with a balance of "0"

## How it works

This tool uses the bech32 encoding/decoding to change the address prefix from 'stars' to 'cosmos' while preserving the underlying public key data.

The balance checker connects to the Cosmos Hub REST API to query account balances for each converted address.