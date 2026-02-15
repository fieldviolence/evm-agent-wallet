import { describe, expect, it, afterEach } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  createWallet,
  loadWallet,
  walletExists,
  importWallet,
} from "./wallet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tempDir: string;

function tempWalletPath(): string {
  tempDir = mkdtempSync(join(tmpdir(), "wallet-test-"));
  return join(tempDir, "wallet.json");
}

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("wallet", () => {
  it("createWallet generates valid wallet file", () => {
    const p = tempWalletPath();
    const data = createWallet(p);

    expect(data.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(data.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(typeof data.createdAt).toBe("string");
  });

  it("createWallet throws if wallet already exists", () => {
    const p = tempWalletPath();
    createWallet(p);

    expect(() => createWallet(p)).toThrow("Wallet already exists");
  });

  it("loadWallet reads back created wallet correctly", () => {
    const p = tempWalletPath();
    const created = createWallet(p);
    const loaded = loadWallet(p);

    expect(loaded.address).toBe(created.address);
    expect(loaded.privateKey).toBe(created.privateKey);
    expect(loaded.createdAt).toBe(created.createdAt);
  });

  it("loadWallet throws if no wallet file", () => {
    const p = tempWalletPath();

    expect(() => loadWallet(p)).toThrow("Wallet file not found");
  });

  it("walletExists returns false then true after create", () => {
    const p = tempWalletPath();

    expect(walletExists(p)).toBe(false);
    createWallet(p);
    expect(walletExists(p)).toBe(true);
  });

  it("importWallet creates wallet from private key (same address)", () => {
    const p = tempWalletPath();
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    const data = importWallet(privateKey, p);

    expect(data.address).toBe(account.address);
    expect(data.privateKey).toBe(privateKey);
  });

  it("importWallet handles key without 0x prefix", () => {
    const p = tempWalletPath();
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const keyWithoutPrefix = privateKey.slice(2); // strip 0x

    const data = importWallet(keyWithoutPrefix, p);

    expect(data.address).toBe(account.address);
    expect(data.privateKey).toBe(privateKey); // should add 0x back
  });
});
