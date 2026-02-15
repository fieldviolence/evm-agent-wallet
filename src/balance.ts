import { formatEther, formatUnits, type Address } from "viem";
import { getPublicClient, getChainConfig } from "./chains";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenBalance {
  symbol: string;
  address: Address;
  balance: string;
  raw: string;
}

export interface WalletBalance {
  address: Address;
  chain: string;
  eth: string;
  ethRaw: string;
  tokens: TokenBalance[];
}

// ---------------------------------------------------------------------------
// ERC-20 ABI (balanceOf only)
// ---------------------------------------------------------------------------

const ERC20_BALANCE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Query ETH balance and all known ERC-20 token balances for an address on
 * the given chain.  All RPC calls run in parallel.  If a single token
 * balance query fails the token is reported with balance "0" instead of
 * crashing the entire request.
 */
export async function getBalance(
  address: Address,
  chainName: string,
): Promise<WalletBalance> {
  const client = getPublicClient(chainName);
  const config = getChainConfig(chainName);
  const tokenEntries = Object.values(config.tokens);

  // Fire ETH + all token balance reads in parallel
  const [ethRaw, ...tokenResults] = await Promise.all([
    client.getBalance({ address }),
    ...tokenEntries.map((token) =>
      client
        .readContract({
          address: token.address,
          abi: ERC20_BALANCE_ABI,
          functionName: "balanceOf",
          args: [address],
        })
        .catch(() => 0n),
    ),
  ]);

  const tokens: TokenBalance[] = tokenEntries.map((token, i) => {
    const raw = tokenResults[i] as bigint;
    return {
      symbol: token.symbol,
      address: token.address as Address,
      balance: formatUnits(raw, token.decimals),
      raw: raw.toString(),
    };
  });

  return {
    address,
    chain: chainName,
    eth: formatEther(ethRaw),
    ethRaw: ethRaw.toString(),
    tokens,
  };
}
