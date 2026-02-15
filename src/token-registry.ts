import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { getWalletPath } from "./wallet";
import type { TokenInfo } from "./chains";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Chain → symbol → token info */
export type TokenRegistry = Record<string, Record<string, TokenInfo>>;

// ---------------------------------------------------------------------------
// Path
// ---------------------------------------------------------------------------

/** Return the tokens file path — sits next to the wallet file. */
export function getTokensPath(): string {
  const walletPath = getWalletPath();
  return resolve(dirname(walletPath), "tokens.json");
}

// ---------------------------------------------------------------------------
// File operations
// ---------------------------------------------------------------------------

/** Load custom tokens from disk. Returns empty registry if file doesn't exist. */
export function loadTokens(): TokenRegistry {
  const p = getTokensPath();
  if (!existsSync(p)) return {};

  try {
    return JSON.parse(readFileSync(p, "utf-8")) as TokenRegistry;
  } catch {
    return {};
  }
}

/** Persist the token registry to disk. */
function saveTokens(registry: TokenRegistry): void {
  const p = getTokensPath();
  writeFileSync(p, JSON.stringify(registry, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Add a custom token for a chain. Overwrites if symbol already exists.
 */
export function addToken(
  chain: string,
  symbol: string,
  address: `0x${string}`,
  decimals: number,
): TokenInfo {
  const registry = loadTokens();
  const upper = symbol.toUpperCase();

  if (!registry[chain]) registry[chain] = {};

  const token: TokenInfo = { symbol: upper, address, decimals };
  registry[chain][upper] = token;
  saveTokens(registry);
  return token;
}

/**
 * Remove a custom token by symbol from a chain.
 * @returns true if the token was found and removed, false otherwise.
 */
export function removeToken(chain: string, symbol: string): boolean {
  const registry = loadTokens();
  const upper = symbol.toUpperCase();

  if (!registry[chain]?.[upper]) return false;

  delete registry[chain][upper];
  if (Object.keys(registry[chain]).length === 0) delete registry[chain];
  saveTokens(registry);
  return true;
}

/**
 * List all custom tokens, optionally filtered by chain.
 */
export function listTokens(chain?: string): TokenRegistry {
  const registry = loadTokens();
  if (!chain) return registry;
  return registry[chain] ? { [chain]: registry[chain] } : {};
}
