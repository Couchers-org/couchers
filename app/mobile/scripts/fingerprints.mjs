#!/usr/bin/env node
// Computes Expo fingerprints for our release variants and either checks them
// against the repo's fingerprints.json or writes the new values to it.
//
// The fingerprint is the runtimeVersion that Expo stamps into a native binary;
// an OTA bundle only applies when its runtimeVersion matches the installed
// build. We pin the fingerprints in app/mobile/fingerprints.json so every
// branch's CI can detect when a change has moved them — that is the signal
// that a new store build needs to be cut (which happens only on develop).
//
// Usage:
//   node scripts/fingerprints.mjs check   # fail if computed != committed
//   node scripts/fingerprints.mjs write   # update fingerprints.json
//
// Run from app/mobile.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(HERE, "..", "fingerprints.json");
const VARIANTS = ["devtool", "staging", "production"];
const PLATFORMS = ["ios", "android"];

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
    out[v] = {};
    for (const p of PLATFORMS) {
      process.stderr.write(`computing fingerprint for ${v}/${p}…\n`);
      out[v][p] = compute(v, p);
    }
  }
  return out;
}

function readCommitted() {
  if (!existsSync(FILE)) return null;
  return JSON.parse(readFileSync(FILE, "utf-8"));
}

function diff(actual, committed) {
  const out = [];
  for (const v of VARIANTS) {
    for (const p of PLATFORMS) {
      const c = committed?.[v]?.[p];
      const a = actual[v][p];
      if (c !== a)
        out.push({ variant: v, platform: p, expected: c, actual: a });
    }
  }
  return out;
}

const mode = process.argv[2];

if (mode === "check") {
  const committed = readCommitted();
  if (!committed) {
    process.stderr.write(
      `No fingerprints.json found at ${FILE}.\n` +
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
    process.stderr.write(`  ${m.variant}/${m.platform}:\n`);
    process.stderr.write(`    committed: ${m.expected ?? "(missing)"}\n`);
    process.stderr.write(`    computed:  ${m.actual}\n`);
  }
  process.stderr.write(
    "\nIf you intentionally made a native-affecting change, run:\n" +
      "  (cd app/mobile && npm run fingerprints:write)\n" +
      "and commit the updated fingerprints.json. Merging it to develop will\n" +
      "trigger a new store build.\n\n" +
      "If you didn't intend to change native behavior, revisit your change —\n" +
      "something in it moved the runtimeVersion.\n",
  );
  process.exit(1);
} else if (mode === "write") {
  const actual = computeAll();
  writeFileSync(FILE, JSON.stringify(actual, null, 2) + "\n");
  process.stdout.write(`Wrote ${FILE}\n`);
} else {
  process.stderr.write("Usage: node scripts/fingerprints.mjs <check|write>\n");
  process.exit(2);
}
