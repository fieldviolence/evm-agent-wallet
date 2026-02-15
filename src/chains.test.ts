import { describe, expect, it } from "bun:test";
import {
  DEFAULT_CHAIN,
  getChainConfig,
  listChains,
} from "./chains";

describe("chains", () => {
  it("DEFAULT_CHAIN is base-sepolia", () => {
    expect(DEFAULT_CHAIN).toBe("base-sepolia");
  });

  it("getChainConfig returns valid config for base-sepolia", () => {
    const config = getChainConfig("base-sepolia");
    expect(config.chain.id).toBe(84532);
    expect(config.name).toBe("base-sepolia");
    expect(config.rpcUrl).toBeTruthy();
    expect(config.tokens.USDC).toBeDefined();
    expect(config.tokens.WETH).toBeDefined();
  });

  it("getChainConfig throws for unknown chain", () => {
    expect(() => getChainConfig("unknown-chain")).toThrow("Unknown chain");
  });

  it("listChains returns all 4 chains", () => {
    const chains = listChains();
    expect(chains).toHaveLength(4);
    expect(chains).toContain("base-sepolia");
    expect(chains).toContain("base");
    expect(chains).toContain("ethereum");
    expect(chains).toContain("ethereum-sepolia");
  });

  it("all chains have USDC and WETH tokens", () => {
    for (const name of listChains()) {
      const config = getChainConfig(name);
      expect(config.tokens.USDC).toBeDefined();
      expect(config.tokens.USDC.symbol).toBe("USDC");
      expect(config.tokens.USDC.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(config.tokens.WETH).toBeDefined();
      expect(config.tokens.WETH.symbol).toBe("WETH");
      expect(config.tokens.WETH.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    }
  });
});
