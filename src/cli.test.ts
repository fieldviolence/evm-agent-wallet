import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const CLI = join(import.meta.dir, "cli.ts");

describe("wallet CLI", () => {
  let tempDir: string;
  let walletPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "wallet-cli-test-"));
    walletPath = join(tempDir, "wallet.json");
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  const run = async (args: string) => {
    const proc = Bun.spawn(["bun", CLI, ...args.split(" ")], {
      env: { ...process.env, WALLET_PATH: walletPath },
      stdout: "pipe",
      stderr: "pipe",
    });
    const text = await new Response(proc.stdout).text();
    await proc.exited;
    return JSON.parse(text.trim());
  };

  const runRaw = async (args: string) => {
    const proc = Bun.spawn(["bun", CLI, ...args.split(" ")], {
      env: { ...process.env, WALLET_PATH: walletPath },
      stdout: "pipe",
      stderr: "pipe",
    });
    const text = await new Response(proc.stdout).text();
    await proc.exited;
    return text;
  };

  test("create generates wallet", async () => {
    const result = await run("create");
    expect(result.status).toBe("created");
    expect(result.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  test("address shows address after create", async () => {
    const created = await run("create");
    const result = await run("address");
    expect(result.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(result.address).toBe(created.address);
  });

  test("export shows private key after create", async () => {
    await run("create");
    const result = await run("export");
    expect(result.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(result.warning).toBeDefined();
  });

  test("balance works after create", async () => {
    await run("create");
    const result = await run("balance");
    expect(result.chain).toBe("base-sepolia");
    expect(result.tokens).toBeDefined();
    expect(Array.isArray(result.tokens)).toBe(true);
  });

  test("help shows usage", async () => {
    const output = await runRaw("help");
    expect(output).toContain("Usage: wallet");
  });
});
