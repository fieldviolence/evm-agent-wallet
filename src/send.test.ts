import { describe, expect, it } from "bun:test";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sendEth, sendToken } from "./send";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000001" as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sendToken", () => {
  it("throws for unknown token symbol", () => {
    const key = generatePrivateKey();

    expect(
      sendToken(key, ZERO_ADDRESS, "1", "FAKE", "base-sepolia"),
    ).rejects.toThrow("Unknown token");
  });
});

describe("sendEth", () => {
  it("rejects with insufficient funds", async () => {
    const key = generatePrivateKey();

    await expect(
      sendEth(key, ZERO_ADDRESS, "1", "base-sepolia"),
    ).rejects.toThrow();
  }, 15_000);
});

describe("sendToken (insufficient funds)", () => {
  it("rejects with insufficient funds for USDC", async () => {
    const key = generatePrivateKey();

    await expect(
      sendToken(key, ZERO_ADDRESS, "1", "USDC", "base-sepolia"),
    ).rejects.toThrow();
  }, 15_000);
});
