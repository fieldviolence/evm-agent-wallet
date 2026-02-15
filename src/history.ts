import { formatUnits, parseAbiItem, type Address, type Hex } from "viem";
import { getPublicClient, getChainConfig } from "./chains";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TxRecord {
  txHash: Hex;
  blockNumber: string;
  from: Address;
  to: Address;
  token: string;
  amount: string;
  direction: "in" | "out";
}

// ---------------------------------------------------------------------------
// ABI
// ---------------------------------------------------------------------------

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Query recent ERC-20 Transfer events involving `address` on the given chain.
 * Returns records sorted by block number descending (most recent first).
 *
 * @param address   - Wallet address to query transfers for
 * @param chainName - Chain identifier (e.g. "base-sepolia")
 * @param blockRange - How many blocks back to scan (default 5000)
 */
export async function getHistory(
  address: Address,
  chainName: string,
  blockRange: bigint = 5000n,
): Promise<TxRecord[]> {
  const client = getPublicClient(chainName);
  const config = getChainConfig(chainName);

  const currentBlock = await client.getBlockNumber();
  const fromBlock = currentBlock > blockRange ? currentBlock - blockRange : 0n;

  // Build a reverse lookup: token address (lowercased) -> { symbol, decimals }
  const tokenLookup = new Map<
    string,
    { symbol: string; decimals: number }
  >();
  for (const token of Object.values(config.tokens)) {
    tokenLookup.set(token.address.toLowerCase(), {
      symbol: token.symbol,
      decimals: token.decimals,
    });
  }

  // Query outgoing and incoming transfers in parallel
  const [outgoing, incoming] = await Promise.all([
    client.getLogs({
      event: TRANSFER_EVENT,
      args: { from: address },
      fromBlock,
      toBlock: currentBlock,
    }),
    client.getLogs({
      event: TRANSFER_EVENT,
      args: { to: address },
      fromBlock,
      toBlock: currentBlock,
    }),
  ]);

  // Map raw logs to TxRecord
  const mapLog = (
    log: (typeof outgoing)[number],
    direction: "in" | "out",
  ): TxRecord => {
    const contractAddr = log.address.toLowerCase();
    const tokenInfo = tokenLookup.get(contractAddr);
    const symbol = tokenInfo?.symbol ?? contractAddr;
    const decimals = tokenInfo?.decimals ?? 18;
    const value = (log.args.value as bigint) ?? 0n;

    return {
      txHash: log.transactionHash as Hex,
      blockNumber: (log.blockNumber ?? 0n).toString(),
      from: log.args.from as Address,
      to: log.args.to as Address,
      token: symbol,
      amount: formatUnits(value, decimals),
      direction,
    };
  };

  const records: TxRecord[] = [
    ...outgoing.map((log) => mapLog(log, "out")),
    ...incoming.map((log) => mapLog(log, "in")),
  ];

  // Sort by block number descending (most recent first)
  records.sort((a, b) => {
    const diff = BigInt(b.blockNumber) - BigInt(a.blockNumber);
    return diff > 0n ? 1 : diff < 0n ? -1 : 0;
  });

  return records;
}
