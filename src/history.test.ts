import { describe, expect, it } from "bun:test";
import { getHistory } from "./history";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

describe("getHistory", () => {
  it("returns array for zero address", async () => {
    const result = await getHistory(ZERO_ADDRESS, "base-sepolia", 100n);

    expect(Array.isArray(result)).toBe(true);

    // Each record has the correct shape
    for (const record of result) {
      expect(typeof record.txHash).toBe("string");
      expect(typeof record.blockNumber).toBe("string");
      expect(record.from).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(record.to).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(typeof record.token).toBe("string");
      expect(typeof record.amount).toBe("string");
      expect(["in", "out"]).toContain(record.direction);
    }
  }, 15_000);
});
