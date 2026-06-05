#!/usr/bin/env node
// Usage: node scripts/fingerprints.mjs <check|write>  (run from app/mobile)
// Writes/checks `fingerprints` (the runtimeVersion) and `fingerprints.full` (a
// review tripwire over the OTA-safe inputs the runtime fingerprint skips).

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createFingerprintAsync, SourceSkips } from "@expo/fingerprint";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");
const RUNTIME_FILE = resolve(PROJECT_ROOT, "fingerprints");
const FULL_FILE = resolve(PROJECT_ROOT, "fingerprints.full");
const EAS_JSON = resolve(PROJECT_ROOT, "eas.json");
const VARIANTS = ["devtool", "staging", "production"];
const PLATFORMS = ["ios", "android"];

const HEADER = [
  "# DO NOT EDIT MANUALLY!",
  "# Regenerate with `cd app/mobile && npm run fingerprints:write`",
].join("\n");

// Via the CLI so it stays byte-identical to the runtimeVersion EAS computes.
function computeRuntime(variant, platform) {
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

// .fingerprintignore drops eas.json from the runtime fingerprint; re-add it as an
// explicit source so the full tripwire still catches eas.json changes.
const EAS_JSON_SOURCE = {
  type: "contents",
  id: "eas.json",
  contents: readFileSync(EAS_JSON),
  reasons: ["full-fingerprint"],
};

async function computeFull(variant, platform) {
  process.env.APP_VARIANT = variant;
  const fp = await createFingerprintAsync(PROJECT_ROOT, {
    platforms: [platform],
    // Skip the extra section only: it carries a per-commit gitHash/version.
    sourceSkips: SourceSkips.ExpoConfigExtraSection,
    extraSources: [EAS_JSON_SOURCE],
    silent: true,
  });
  return fp.hash;
}

async function computeAll() {
  const runtime = {};
  const full = {};
  for (const v of VARIANTS) {
    for (const p of PLATFORMS) {
      process.stderr.write(`computing fingerprints for ${v}/${p}…\n`);
      runtime[`${v}/${p}`] = computeRuntime(v, p);
      full[`${v}/${p}`] = await computeFull(v, p);
    }
  }
  return { runtime, full };
}

function readCommitted(file) {
  if (!existsSync(file)) return null;
  const out = {};
  for (const raw of readFileSync(file, "utf-8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    out[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return out;
}

function serialize(actual, header) {
  const lines = [header];
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
      if (committed?.[key] !== actual[key]) {
        out.push({ key, expected: committed?.[key], actual: actual[key] });
      }
    }
  }
  return out;
}

function check(label, file, actual, advice) {
  const committed = readCommitted(file);
  if (!committed) {
    process.stderr.write(
      `No ${label} file found at ${file}.\n` +
        `Run \`npm run fingerprints:write\` (in app/mobile) to create it.\n`,
    );
    return true;
  }
  const mismatches = diff(actual, committed);
  if (mismatches.length === 0) {
    process.stdout.write(`${label}: match.\n`);
    return false;
  }
  process.stderr.write(`${label}: mismatch.\n`);
  for (const m of mismatches) {
    process.stderr.write(`  ${m.key}:\n`);
    process.stderr.write(`    committed: ${m.expected ?? "(missing)"}\n`);
    process.stderr.write(`    computed:  ${m.actual}\n`);
  }
  process.stderr.write("\n" + advice + "\n");
  return true;
}

const RUNTIME_ADVICE =
  "A native-affecting change moved the runtimeVersion. If intended, run\n" +
  "  (cd app/mobile && npm run fingerprints:write)\n" +
  "and commit the updated fingerprints. Merging it to develop will trigger a new\n" +
  "store build. If you didn't intend to change native behavior, revisit your\n" +
  "change — something in it moved the runtimeVersion.";

const FULL_ADVICE =
  "An OTA-safe but native-adjacent input changed (eas.json, the app version, a\n" +
  "build script, or .gitignore). This needs no new store build, but should be\n" +
  "reviewed. If the change is intended, run\n" +
  "  (cd app/mobile && npm run fingerprints:write)\n" +
  "and commit the updated fingerprints.full to acknowledge it.";

async function main() {
  const mode = process.argv[2];
  if (mode === "check") {
    const { runtime, full } = await computeAll();
    let failed = false;
    failed =
      check("fingerprints (runtime)", RUNTIME_FILE, runtime, RUNTIME_ADVICE) ||
      failed;
    failed =
      check("fingerprints.full (review)", FULL_FILE, full, FULL_ADVICE) ||
      failed;
    process.exit(failed ? 1 : 0);
  } else if (mode === "write") {
    const { runtime, full } = await computeAll();
    writeFileSync(RUNTIME_FILE, serialize(runtime, HEADER));
    writeFileSync(FULL_FILE, serialize(full, HEADER));
    process.stdout.write(`Wrote ${RUNTIME_FILE}\nWrote ${FULL_FILE}\n`);
  } else {
    process.stderr.write(
      "Usage: node scripts/fingerprints.mjs <check|write>\n",
    );
    process.exit(2);
  }
}

await main();
