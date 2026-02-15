#!/usr/bin/env bun

import { createWallet, loadWallet, walletExists, importWallet } from "./wallet";
import { getBalance } from "./balance";
import { sendEth, sendToken } from "./send";
import { scanTokens } from "./tokens";
import { getHistory } from "./history";
import { DEFAULT_CHAIN, listChains } from "./chains";
import { addToken, removeToken, listTokens } from "./token-registry";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** BigInt-safe JSON replacer */
const replacer = (_key: string, value: unknown) =>
  typeof value === "bigint" ? value.toString() : value;

/** Print JSON to stdout */
function out(data: unknown): void {
  console.log(JSON.stringify(data, replacer, 2));
}

/** Print JSON error to stderr and exit */
function fail(message: string): never {
  console.error(JSON.stringify({ error: message }));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // skip bun + script path
  const command = args[0] ?? "help";
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = "true";
        i += 1;
      }
    } else {
      positional.push(arg);
      i += 1;
    }
  }

  return { command, positional, flags };
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

const HELP_TEXT = `Usage: wallet <command> [options]

Commands:
  create                          Generate a new wallet
  import <private-key>            Import wallet from private key
  address                         Show wallet address
  balance [--chain <chain>]       Show ETH + token balances
  send <amount> <to> [options]    Send ETH or tokens
  tokens [--chain <chain>]        List token balances
  history [--chain <chain>]       Recent transaction history
  token add <symbol> <address>    Register a custom token
  token remove <symbol>           Remove a custom token
  token list                      List custom tokens
  export                          Print private key
  help                            Show this help

Send options:
  --token <symbol|address>        Token to send (default: ETH)
  --chain <chain>                 Chain (default: ${DEFAULT_CHAIN})

Token options:
  --decimals <n>                  Token decimals (default: 18)
  --chain <chain>                 Chain (default: ${DEFAULT_CHAIN})

Chains: ${listChains().join(", ")}

Environment:
  WALLET_PATH                     Custom wallet file path (default: .wallet/wallet.json in cwd)`;

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

async function main() {
  const { command, positional, flags } = parseArgs(process.argv);
  const chain = flags.chain ?? DEFAULT_CHAIN;

  try {
    switch (command) {
      case "create": {
        if (walletExists()) {
          fail("Wallet already exists");
        }
        const wallet = createWallet();
        out({ status: "created", address: wallet.address });
        break;
      }

      case "import": {
        const pk = positional[0];
        if (!pk) {
          fail("Usage: wallet import <private-key>");
        }
        const wallet = importWallet(pk);
        out({ status: "imported", address: wallet.address });
        break;
      }

      case "address": {
        const wallet = loadWallet();
        out({ address: wallet.address });
        break;
      }

      case "balance": {
        const wallet = loadWallet();
        const balance = await getBalance(wallet.address, chain);
        out(balance);
        break;
      }

      case "send": {
        const amount = positional[0];
        const to = positional[1];
        if (!amount || !to) {
          fail("Usage: wallet send <amount> <to> [--token <token>] [--chain <chain>]");
        }
        const wallet = loadWallet();
        const token = flags.token;
        let result;
        if (token && token.toUpperCase() !== "ETH") {
          result = await sendToken(
            wallet.privateKey,
            to as `0x${string}`,
            amount,
            token,
            chain,
          );
        } else {
          result = await sendEth(
            wallet.privateKey,
            to as `0x${string}`,
            amount,
            chain,
          );
        }
        out(result);
        break;
      }

      case "tokens": {
        const wallet = loadWallet();
        const scan = await scanTokens(wallet.address, chain);
        out(scan);
        break;
      }

      case "history": {
        const wallet = loadWallet();
        const records = await getHistory(wallet.address, chain);
        out({ address: wallet.address, chain, transactions: records });
        break;
      }

      case "token": {
        const sub = positional[0];
        if (sub === "add") {
          const symbol = positional[1];
          const address = positional[2];
          if (!symbol || !address) {
            fail("Usage: wallet token add <symbol> <address> [--decimals <n>] [--chain <chain>]");
          }
          const decimals = parseInt(flags.decimals ?? "18", 10);
          const token = addToken(chain, symbol, address as `0x${string}`, decimals);
          out({ status: "added", chain, token });
        } else if (sub === "remove") {
          const symbol = positional[1];
          if (!symbol) {
            fail("Usage: wallet token remove <symbol> [--chain <chain>]");
          }
          const removed = removeToken(chain, symbol);
          if (!removed) {
            fail(`Token "${symbol.toUpperCase()}" not found on chain "${chain}"`);
          }
          out({ status: "removed", chain, symbol: symbol.toUpperCase() });
        } else if (sub === "list") {
          const registry = listTokens(chain);
          out(registry);
        } else {
          fail('Usage: wallet token <add|remove|list> [options]');
        }
        break;
      }

      case "export": {
        const wallet = loadWallet();
        out({
          warning: "NEVER share your private key with anyone!",
          privateKey: wallet.privateKey,
        });
        break;
      }

      case "help":
        console.log(HELP_TEXT);
        break;

      default:
        fail(`Unknown command: "${command}". Run "wallet help" for usage.`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    fail(message);
  }
}

main();
