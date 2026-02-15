import { describe, expect, it } from "bun:test";
import { getBalance } from "./balance";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

describe("getBalance", () => {
  it("returns ETH and token balances on base-sepolia", async () => {
    const result = await getBalance(ZERO_ADDRESS, "base-sepolia");

    // Top-level shape
    expect(result.address).toBe(ZERO_ADDRESS);
    expect(result.chain).toBe("base-sepolia");
    expect(typeof result.eth).toBe("string");
    expect(typeof result.ethRaw).toBe("string");
    expect(Array.isArray(result.tokens)).toBe(true);

    // Should contain the known tokens (USDC and WETH at minimum)
    const symbols = result.tokens.map((t) => t.symbol);
    expect(symbols).toContain("USDC");
    expect(symbols).toContain("WETH");

    // Each token entry has the correct shape
    for (const token of result.tokens) {
      expect(typeof token.symbol).toBe("string");
      expect(token.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(typeof token.balance).toBe("string");
      expect(typeof token.raw).toBe("string");
    }
  }, 15_000); // generous timeout for public RPC
});
