import { describe, expect, it, beforeEach, afterAll } from "bun:test";
import { mkdirSync, rmSync, existsSync } from "fs";
import { resolve } from "path";
import { addToken, removeToken, listTokens, loadTokens, getTokensPath } from "./token-registry";

const TEST_DIR = resolve("/tmp", `test-tokens-${Date.now()}`);
const WALLET_PATH = resolve(TEST_DIR, "wallet.json");

beforeEach(() => {
  // Clean slate for each test
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });
  process.env.WALLET_PATH = WALLET_PATH;
});

afterAll(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  delete process.env.WALLET_PATH;
});

describe("token-registry", () => {
  it("getTokensPath sits next to wallet file", () => {
    const p = getTokensPath();
    expect(p).toBe(resolve(TEST_DIR, "tokens.json"));
  });

  it("loadTokens returns empty registry when no file exists", () => {
    expect(loadTokens()).toEqual({});
  });

  it("addToken creates a new entry", () => {
    const token = addToken("base-sepolia", "DAI", "0x1234567890abcdef1234567890abcdef12345678", 18);
    expect(token.symbol).toBe("DAI");
    expect(token.decimals).toBe(18);

    const registry = loadTokens();
    expect(registry["base-sepolia"]?.DAI).toEqual(token);
  });

  it("addToken uppercases the symbol", () => {
    addToken("base-sepolia", "dai", "0x1234567890abcdef1234567890abcdef12345678", 18);
    const registry = loadTokens();
    expect(registry["base-sepolia"]?.DAI).toBeDefined();
    expect(registry["base-sepolia"]?.dai).toBeUndefined();
  });

  it("addToken overwrites existing token with same symbol", () => {
    addToken("base-sepolia", "DAI", "0x1111111111111111111111111111111111111111", 18);
    addToken("base-sepolia", "DAI", "0x2222222222222222222222222222222222222222", 18);
    const registry = loadTokens();
    expect(registry["base-sepolia"]?.DAI?.address).toBe("0x2222222222222222222222222222222222222222");
  });

  it("removeToken removes an existing token", () => {
    addToken("base-sepolia", "DAI", "0x1234567890abcdef1234567890abcdef12345678", 18);
    const removed = removeToken("base-sepolia", "DAI");
    expect(removed).toBe(true);
    expect(loadTokens()).toEqual({});
  });

  it("removeToken returns false for non-existent token", () => {
    expect(removeToken("base-sepolia", "NOPE")).toBe(false);
  });

  it("removeToken cleans up empty chain entries", () => {
    addToken("base-sepolia", "DAI", "0x1234567890abcdef1234567890abcdef12345678", 18);
    removeToken("base-sepolia", "DAI");
    const registry = loadTokens();
    expect(registry["base-sepolia"]).toBeUndefined();
  });

  it("listTokens returns all tokens when no chain specified", () => {
    addToken("base-sepolia", "DAI", "0x1111111111111111111111111111111111111111", 18);
    addToken("base", "WBTC", "0x2222222222222222222222222222222222222222", 8);
    const all = listTokens();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all["base-sepolia"]?.DAI).toBeDefined();
    expect(all["base"]?.WBTC).toBeDefined();
  });

  it("listTokens filters by chain", () => {
    addToken("base-sepolia", "DAI", "0x1111111111111111111111111111111111111111", 18);
    addToken("base", "WBTC", "0x2222222222222222222222222222222222222222", 8);
    const filtered = listTokens("base-sepolia");
    expect(Object.keys(filtered)).toHaveLength(1);
    expect(filtered["base-sepolia"]?.DAI).toBeDefined();
  });

  it("listTokens returns empty for chain with no custom tokens", () => {
    expect(listTokens("ethereum")).toEqual({});
  });
});
