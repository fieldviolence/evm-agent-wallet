import { parseEther, parseUnits, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getWalletClient, getChainConfig, DEFAULT_CHAIN } from "./chains";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendResult {
  txHash: Hex;
  from: Address;
  to: Address;
  amount: string;
  token: string;
  chain: string;
}

// ---------------------------------------------------------------------------
// ERC-20 ABI (transfer only)
// ---------------------------------------------------------------------------

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send native ETH to a recipient address.
 *
 * @param privateKey   - Hex-encoded private key of the sender
 * @param to           - Recipient address
 * @param amount       - Human-readable ETH amount (e.g. "0.1")
 * @param chainName    - Target chain (defaults to base-sepolia)
 * @returns The transaction hash and metadata
 */
export async function sendEth(
  privateKey: Hex,
  to: Address,
  amount: string,
  chainName: string = DEFAULT_CHAIN,
): Promise<SendResult> {
  const account = privateKeyToAccount(privateKey);
  const wallet = getWalletClient(chainName, account);

  const txHash = await wallet.sendTransaction({
    to,
    value: parseEther(amount),
  });

  return {
    txHash,
    from: account.address,
    to,
    amount,
    token: "ETH",
    chain: chainName,
  };
}

/**
 * Send ERC-20 tokens to a recipient address.
 *
 * `tokenSymbolOrAddress` can be either:
 * - A known token symbol (case-insensitive), e.g. "USDC"
 * - A raw contract address starting with "0x" (assumes 18 decimals)
 *
 * @param privateKey          - Hex-encoded private key of the sender
 * @param to                  - Recipient address
 * @param amount              - Human-readable token amount (e.g. "10.5")
 * @param tokenSymbolOrAddress - Token symbol or contract address
 * @param chainName           - Target chain (defaults to base-sepolia)
 * @returns The transaction hash and metadata
 */
export async function sendToken(
  privateKey: Hex,
  to: Address,
  amount: string,
  tokenSymbolOrAddress: string,
  chainName: string = DEFAULT_CHAIN,
): Promise<SendResult> {
  const account = privateKeyToAccount(privateKey);
  const wallet = getWalletClient(chainName, account);
  const config = getChainConfig(chainName);

  let tokenAddress: Address;
  let decimals: number;
  let tokenLabel: string;

  if (tokenSymbolOrAddress.startsWith("0x")) {
    // Raw contract address — assume 18 decimals
    tokenAddress = tokenSymbolOrAddress as Address;
    decimals = 18;
    tokenLabel = tokenSymbolOrAddress;
  } else {
    // Look up by symbol (case-insensitive)
    const upperSymbol = tokenSymbolOrAddress.toUpperCase();
    const tokenInfo = config.tokens[upperSymbol];

    if (!tokenInfo) {
      const validTokens = Object.keys(config.tokens).join(", ");
      throw new Error(
        `Unknown token "${tokenSymbolOrAddress}" on ${chainName}. ` +
          `Valid tokens: ${validTokens}`,
      );
    }

    tokenAddress = tokenInfo.address;
    decimals = tokenInfo.decimals;
    tokenLabel = tokenInfo.symbol;
  }

  const parsedAmount = parseUnits(amount, decimals);

  const txHash = await wallet.writeContract({
    address: tokenAddress,
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [to, parsedAmount],
  });

  return {
    txHash,
    from: account.address,
    to,
    amount,
    token: tokenLabel,
    chain: chainName,
  };
}
