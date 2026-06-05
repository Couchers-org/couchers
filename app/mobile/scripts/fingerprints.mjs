#!/usr/bin/env node
// Usage: node scripts/fingerprints.mjs <check|write>  (run from app/mobile)

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(HERE, "..", "fingerprints");
const VARIANTS = ["devtool", "staging", "production"];
const PLATFORMS = ["ios", "android"];

const HEADER =
  "# Expo runtimeVersion fingerprints per variant × platform. Regenerate with: cd app/mobile && npm run fingerprints:write";

function compute(variant, platform) {
  const r = spawnSync(
    "npx",
    ["expo-updates", "fingerprint:generate", "--platform", platform],
    {
      env: { ...process.env, APP_VARIANT: variant },
      encoding: "utf-8",
    },
  );
  if (r.status !== 0) {
    process.stderr.write(r.stderr ?? "");
    throw new Error(`fingerprint:generate failed for ${variant}/${platform}`);
  }
  const json = JSON.parse(r.stdout);
  if (!json.hash) {
    throw new Error(
      `fingerprint:generate did not return a hash for ${variant}/${platform}`,
    );
  }
  return json.hash;
}

function computeAll() {
  const out = {};
  for (const v of VARIANTS) {
    for (const p of PLATFORMS) {
      process.stderr.write(`computing fingerprint for ${v}/${p}…\n`);
      out[`${v}/${p}`] = compute(v, p);
    }
  }
  return out;
}

function readCommitted() {
  if (!existsSync(FILE)) return null;
  const out = {};
  for (const raw of readFileSync(FILE, "utf-8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    out[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return out;
}

function serialize(actual) {
  const lines = [HEADER];
  for (const v of VARIANTS) {
    for (const p of PLATFORMS) {
      lines.push(`${v}/${p}=${actual[`${v}/${p}`]}`);
    }
  }
  return lines.join("\n") + "\n";
}

function diff(actual, committed) {
  const out = [];
  for (const v of VARIANTS) {
    for (const p of PLATFORMS) {
      const key = `${v}/${p}`;
      const c = committed?.[key];
      const a = actual[key];
      if (c !== a) out.push({ key, expected: c, actual: a });
    }
  }
  return out;
}

const mode = process.argv[2];

if (mode === "check") {
  const committed = readCommitted();
  if (!committed) {
    process.stderr.write(
      `No fingerprints file found at ${FILE}.\n` +
        `Run \`npm run fingerprints:write\` (in app/mobile) to create it.\n`,
    );
    process.exit(1);
  }
  const actual = computeAll();
  const mismatches = diff(actual, committed);
  if (mismatches.length === 0) {
    process.stdout.write("Fingerprints match.\n");
    process.exit(0);
  }
  process.stderr.write(
    "Fingerprint mismatch — native-affecting change(s) detected:\n\n",
  );
  for (const m of mismatches) {
    process.stderr.write(`  ${m.key}:\n`);
    process.stderr.write(`    committed: ${m.expected ?? "(missing)"}\n`);
    process.stderr.write(`    computed:  ${m.actual}\n`);
  }
  process.stderr.write(
    "\nIf you intentionally made a native-affecting change, run:\n" +
      "  (cd app/mobile && npm run fingerprints:write)\n" +
      "and commit the updated fingerprints file. Merging it to develop will\n" +
      "trigger a new store build.\n\n" +
      "If you didn't intend to change native behavior, revisit your change —\n" +
      "something in it moved the runtimeVersion.\n",
  );
  process.exit(1);
} else if (mode === "write") {
  const actual = computeAll();
  writeFileSync(FILE, serialize(actual));
  process.stdout.write(`Wrote ${FILE}\n`);
} else {
  process.stderr.write("Usage: node scripts/fingerprints.mjs <check|write>\n");
  process.exit(2);
}
