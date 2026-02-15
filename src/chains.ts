import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type PublicClient,
  type WalletClient,
  type Account,
  type Transport,
} from "viem";
import { baseSepolia, base, mainnet, sepolia } from "viem/chains";
import { loadTokens } from "./token-registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenInfo {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
}

export interface ChainConfig {
  name: string;
  chain: Chain;
  rpcUrl: string;
  tokens: Record<string, TokenInfo>;
}

// ---------------------------------------------------------------------------
// Chain registry
// ---------------------------------------------------------------------------

const CHAINS: Record<string, ChainConfig> = {
  "base-sepolia": {
    name: "base-sepolia",
    chain: baseSepolia,
    rpcUrl: "https://sepolia.base.org",
    tokens: {
      USDC: {
        symbol: "USDC",
        address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        decimals: 6,
      },
      WETH: {
        symbol: "WETH",
        address: "0x4200000000000000000000000000000000000006",
        decimals: 18,
      },
    },
  },
  base: {
    name: "base",
    chain: base,
    rpcUrl: "https://mainnet.base.org",
    tokens: {
      USDC: {
        symbol: "USDC",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimals: 6,
      },
      WETH: {
        symbol: "WETH",
        address: "0x4200000000000000000000000000000000000006",
        decimals: 18,
      },
    },
  },
  ethereum: {
    name: "ethereum",
    chain: mainnet,
    rpcUrl: "https://eth.llamarpc.com",
    tokens: {
      USDC: {
        symbol: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6,
      },
      WETH: {
        symbol: "WETH",
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        decimals: 18,
      },
    },
  },
  "ethereum-sepolia": {
    name: "ethereum-sepolia",
    chain: sepolia,
    rpcUrl: "https://rpc.sepolia.org",
    tokens: {
      USDC: {
        symbol: "USDC",
        address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        decimals: 6,
      },
      WETH: {
        symbol: "WETH",
        address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
        decimals: 18,
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** The default chain used when none is specified. */
export const DEFAULT_CHAIN = "base-sepolia";

/**
 * Return the configuration for a named chain.
 * @throws if the chain name is not recognised.
 */
export function getChainConfig(name: string): ChainConfig {
  const config = CHAINS[name];
  if (!config) {
    throw new Error(
      `Unknown chain: "${name}". Available chains: ${Object.keys(CHAINS).join(", ")}`,
    );
  }

  // Merge custom tokens over built-in defaults
  const custom = loadTokens();
  if (custom[name]) {
    return { ...config, tokens: { ...config.tokens, ...custom[name] } };
  }

  return config;
}

/**
 * Create a viem `PublicClient` for the given chain.
 */
export function getPublicClient(
  chainName: string = DEFAULT_CHAIN,
): PublicClient<Transport, Chain> {
  const config = getChainConfig(chainName);
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  });
}

/**
 * Create a viem `WalletClient` for the given chain and account.
 */
export function getWalletClient(
  chainName: string = DEFAULT_CHAIN,
  account: Account,
): WalletClient<Transport, Chain, Account> {
  const config = getChainConfig(chainName);
  return createWalletClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
    account,
  });
}

/**
 * Return the names of all supported chains.
 */
export function listChains(): string[] {
  return Object.keys(CHAINS);
}
