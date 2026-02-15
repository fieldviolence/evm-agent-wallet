import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Address, Hex } from "viem";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WalletData {
  address: Address;
  privateKey: Hex;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const DEFAULT_WALLET_PATH = resolve(process.cwd(), ".wallet", "wallet.json");

/**
 * Return the wallet file path.
 * Defaults to .wallet/wallet.json in cwd — in Docker each agent's cwd is
 * its workspace, so each agent gets its own wallet automatically.
 * Override with WALLET_PATH env var.
 */
export function getWalletPath(): string {
  return process.env.WALLET_PATH || DEFAULT_WALLET_PATH;
}

// ---------------------------------------------------------------------------
// File operations
// ---------------------------------------------------------------------------

/**
 * Check whether a wallet file exists at the given path.
 */
export function walletExists(walletPath?: string): boolean {
  return existsSync(walletPath ?? getWalletPath());
}

/**
 * Load and parse the wallet JSON from disk.
 * @throws if the file is missing or the JSON is malformed / incomplete.
 */
export function loadWallet(walletPath?: string): WalletData {
  const p = walletPath ?? getWalletPath();

  if (!existsSync(p)) {
    throw new Error(`Wallet file not found: ${p}`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    throw new Error(`Wallet file is not valid JSON: ${p}`);
  }

  const data = raw as Record<string, unknown>;
  if (
    typeof data.address !== "string" ||
    typeof data.privateKey !== "string" ||
    typeof data.createdAt !== "string"
  ) {
    throw new Error(`Wallet file is malformed: ${p}`);
  }

  return {
    address: data.address as Address,
    privateKey: data.privateKey as Hex,
    createdAt: data.createdAt,
  };
}

/**
 * Persist wallet data as JSON. Creates parent directories if needed.
 */
export function saveWallet(data: WalletData, walletPath?: string): void {
  const p = walletPath ?? getWalletPath();
  const dir = dirname(p);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Wallet lifecycle
// ---------------------------------------------------------------------------

/**
 * Generate a brand-new wallet (private key + address) and save it.
 * @throws if a wallet already exists at the target path.
 */
export function createWallet(walletPath?: string): WalletData {
  const p = walletPath ?? getWalletPath();

  if (walletExists(p)) {
    throw new Error(`Wallet already exists at ${p}`);
  }

  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  const data: WalletData = {
    address: account.address,
    privateKey,
    createdAt: new Date().toISOString(),
  };

  saveWallet(data, p);
  return data;
}

/**
 * Import an existing private key (with or without `0x` prefix), derive its
 * address, and save the wallet.
 */
export function importWallet(privateKey: string, walletPath?: string): WalletData {
  const hex: Hex = privateKey.startsWith("0x")
    ? (privateKey as Hex)
    : (`0x${privateKey}` as Hex);

  const account = privateKeyToAccount(hex);

  const data: WalletData = {
    address: account.address,
    privateKey: hex,
    createdAt: new Date().toISOString(),
  };

  saveWallet(data, walletPath);
  return data;
}
