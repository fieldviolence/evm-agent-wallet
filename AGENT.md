# evm-agent-wallet

evm-agent-wallet is a Bun CLI for managing EVM wallets -- create wallets, check balances, send ETH/tokens.

## Installation

Install as a dependency:

```bash
bun add github:<user>/evm-agent-wallet
```

Or clone and install locally:

```bash
git clone https://github.com/<user>/evm-agent-wallet.git
cd evm-agent-wallet && bun install && bun link
```

This registers the `wallet` CLI globally so you can run `wallet` commands from anywhere.

## Commands

### wallet create

Generate a new wallet. Fails if a wallet file already exists.

```bash
wallet create
```

```json
{
  "status": "created",
  "address": "0x1234..."
}
```

### wallet import \<private-key\>

Import a wallet from an existing private key (with or without `0x` prefix).

```bash
wallet import 0xabc123...
```

```json
{
  "status": "imported",
  "address": "0x1234..."
}
```

### wallet address

Print the current wallet address.

```bash
wallet address
```

```json
{
  "address": "0x1234..."
}
```

### wallet balance [--chain \<chain\>]

Show ETH balance and all known token balances.

```bash
wallet balance
wallet balance --chain base
```

```json
{
  "address": "0x...",
  "chain": "base-sepolia",
  "eth": "0.5",
  "ethRaw": "500000000000000000",
  "tokens": [
    { "symbol": "USDC", "address": "0x...", "balance": "100.0", "raw": "100000000" },
    { "symbol": "WETH", "address": "0x...", "balance": "0.1", "raw": "100000000000000000" }
  ]
}
```

### wallet send \<amount\> \<to\> [--token \<symbol\>] [--chain \<chain\>]

Send ETH or an ERC-20 token. The `--token` flag accepts a symbol (e.g. `USDC`) or a raw contract address (assumes 18 decimals).

```bash
wallet send 0.1 0xRecipient
wallet send 50 0xRecipient --token USDC
wallet send 0.01 0xRecipient --chain base
```

```json
{
  "txHash": "0x...",
  "from": "0x...",
  "to": "0x...",
  "amount": "0.1",
  "token": "ETH",
  "chain": "base-sepolia"
}
```

### wallet tokens [--chain \<chain\>]

List token balances only (no ETH).

```bash
wallet tokens
wallet tokens --chain base
```

```json
{
  "address": "0x...",
  "chain": "base-sepolia",
  "tokens": [
    { "symbol": "USDC", "address": "0x...", "balance": "100.0", "raw": "100000000" },
    { "symbol": "WETH", "address": "0x...", "balance": "0.1", "raw": "100000000000000000" }
  ]
}
```

### wallet history [--chain \<chain\>]

Recent ERC-20 transfer history (scans last 5000 blocks).

```bash
wallet history
wallet history --chain base
```

```json
{
  "address": "0x...",
  "chain": "base-sepolia",
  "transactions": [
    {
      "txHash": "0x...",
      "blockNumber": "12345",
      "from": "0x...",
      "to": "0x...",
      "token": "USDC",
      "amount": "10.0",
      "direction": "out"
    }
  ]
}
```

### wallet token add \<symbol\> \<address\> [--decimals \<n\>] [--chain \<chain\>]

Register a custom ERC-20 token. Decimals default to 18 if omitted.

```bash
wallet token add DAI 0x6B175474E89094C44Da98b954EedeAC495271d0F --decimals 18 --chain ethereum
```

```json
{
  "status": "added",
  "chain": "base-sepolia",
  "token": {
    "symbol": "DAI",
    "address": "0x...",
    "decimals": 18
  }
}
```

### wallet token remove \<symbol\> [--chain \<chain\>]

Remove a custom token by symbol.

```bash
wallet token remove DAI
```

```json
{
  "status": "removed",
  "chain": "base-sepolia",
  "symbol": "DAI"
}
```

### wallet token list [--chain \<chain\>]

List all custom tokens. If `--chain` is specified, filters to that chain only.

```bash
wallet token list
wallet token list --chain base-sepolia
```

```json
{
  "base-sepolia": {
    "DAI": {
      "symbol": "DAI",
      "address": "0x...",
      "decimals": 18
    }
  }
}
```

### wallet export

Print the wallet's private key. Handle with extreme care.

```bash
wallet export
```

```json
{
  "warning": "NEVER share your private key with anyone!",
  "privateKey": "0x..."
}
```

## Output Format

- All output is JSON to stdout.
- Errors are JSON to stderr: `{"error": "message"}`.
- Exit code 0 on success, 1 on error.

## Storage

- Wallet file: `.wallet/wallet.json` in the current working directory.
- Custom tokens file: `.wallet/tokens.json` (next to wallet file).
- Override wallet path with the `WALLET_PATH` environment variable.

## Supported Chains

| Name                | Chain ID   | Default |
|---------------------|------------|---------|
| `base-sepolia`      | 84532      | YES     |
| `base`              | 8453       |         |
| `ethereum`          | 1          |         |
| `ethereum-sepolia`  | 11155111   |         |

If no `--chain` flag is provided, `base-sepolia` is used.

## Built-in Tokens

### base-sepolia (default)

| Symbol | Address                                      | Decimals |
|--------|----------------------------------------------|----------|
| USDC   | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | 6        |
| WETH   | `0x4200000000000000000000000000000000000006`   | 18       |

### base

| Symbol | Address                                      | Decimals |
|--------|----------------------------------------------|----------|
| USDC   | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6        |
| WETH   | `0x4200000000000000000000000000000000000006`   | 18       |

### ethereum

| Symbol | Address                                      | Decimals |
|--------|----------------------------------------------|----------|
| USDC   | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 6        |
| WETH   | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | 18       |

### ethereum-sepolia

| Symbol | Address                                      | Decimals |
|--------|----------------------------------------------|----------|
| USDC   | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | 6        |
| WETH   | `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9` | 18       |

## Common Workflows

**First time setup:**

```bash
wallet create
wallet balance
# Fund the address from a faucet (e.g. https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
wallet balance
```

**Send USDC:**

```bash
wallet send 50 0xRecipient --token USDC
```

**Check portfolio (ETH + all tokens):**

```bash
wallet balance
```

**Add a custom token:**

```bash
wallet token add DAI 0x6B175474E89094C44Da98b954EedeAC495271d0F --decimals 18 --chain ethereum
```

**Switch chains:**

```bash
wallet balance --chain base
wallet send 0.01 0xRecipient --chain ethereum
```
