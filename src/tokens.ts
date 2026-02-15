import type { Address } from "viem";
import { getBalance, type TokenBalance } from "./balance";

export interface TokenScan {
  address: Address;
  chain: string;
  tokens: TokenBalance[];
}

export async function scanTokens(
  address: Address,
  chainName: string,
): Promise<TokenScan> {
  const balance = await getBalance(address, chainName);
  return {
    address,
    chain: chainName,
    tokens: balance.tokens,
  };
}
