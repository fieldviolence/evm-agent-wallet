# evm-agent-wallet

A lightweight EVM wallet CLI for agents and developers. Manage wallets, check balances, send ETH and tokens across Base and Ethereum.

> **Are you an agent?** Skip the README — get set up in one shot:
> ```
> curl -s https://raw.githubusercontent.com/fieldviolence/evm-agent-wallet/main/AGENT.md
> ```

## Installation

```bash
bun add github:fieldviolence/evm-agent-wallet
```

Or clone and use directly:

```bash
git clone https://github.com/fieldviolence/evm-agent-wallet.git
cd evm-agent-wallet
bun install
```

## Quick Start

```bash
# Create a new wallet
wallet create

# Check your balance
wallet balance

# Send ETH
wallet send 0.01 0xRecipientAddress
```

## Command Reference

| Command | Description |
|---|---|
| `wallet create` | Generate a new wallet |
| `wallet import <private-key>` | Import wallet from private key |
| `wallet address` | Show wallet address |
| `wallet balance [--chain <chain>]` | Show ETH + token balances |
| `wallet send <amount> <to> [--token <symbol>] [--chain <chain>]` | Send ETH or tokens |
| `wallet tokens [--chain <chain>]` | List token balances |
| `wallet history [--chain <chain>]` | Recent transaction history |
| `wallet token add <symbol> <address> [--decimals <n>] [--chain <chain>]` | Register custom token |
| `wallet token remove <symbol> [--chain <chain>]` | Remove custom token |
| `wallet token list [--chain <chain>]` | List custom tokens |
| `wallet export` | Print private key (careful!) |
| `wallet help` | Show help |

## Supported Chains

| Chain | ID | Default |
|---|---|---|
| base-sepolia | 84532 | Yes |
| base | 8453 | |
| ethereum | 1 | |
| ethereum-sepolia | 11155111 | |

Built-in tokens: **USDC** and **WETH** on each chain. Add custom tokens with `wallet token add`.

## TypeScript API

```typescript
import { createWallet, getBalance, sendEth } from "evm-agent-wallet";

const wallet = createWallet();
const balance = await getBalance(wallet.address, "base-sepolia");
const tx = await sendEth(wallet.privateKey, "0x...", "0.01", "base-sepolia");
```

All CLI commands have programmatic equivalents. See `src/index.ts` for the full export list.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `WALLET_PATH` | Custom wallet file path | `.wallet/wallet.json` in cwd |

## Storage

Wallet data lives in `.wallet/wallet.json` in the current working directory. Each directory gets its own isolated wallet. Add `.wallet/` to your `.gitignore`.

## License

MIT
