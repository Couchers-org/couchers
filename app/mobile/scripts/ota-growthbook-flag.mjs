#!/usr/bin/env node
// Turn staged `ota-stage.mjs` output into the `native_ota_bundles` GrowthBook
// flag value the backend's OTA manifest endpoint reads
// (couchers/servicers/bugs.py: GetMobileUpdateManifest). The backend builds the
// served manifest from this value, so the launch asset / asset URLs here are what
// the device fetches — they must point at wherever the bundle was uploaded.
//
// Usage:
//   node scripts/ota-growthbook-flag.mjs --out ota-staging-out --platforms "ios android"
//
// Prints a JSON object keyed by platform; paste it into the GrowthBook
// `native_ota_bundles` flag for the target environment.

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    args[key.slice(2)] = argv[i + 1];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const outRoot = path.resolve(args.out ?? "ota-out");
  const platforms = (args.platforms ?? "ios android")
    .split(/\s+/)
    .filter(Boolean);

  const flag = {};
  for (const platform of platforms) {
    const manifestPath = path.join(outRoot, platform, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    flag[platform] = {
      id: manifest.id,
      // For operator reference: the published bundle's fingerprint. The installed
      // store build must share it, or the JS won't be compatible.
      runtime_version: manifest.runtimeVersion,
      launch_asset: manifest.launchAsset,
      assets: manifest.assets,
    };
  }

  process.stdout.write(JSON.stringify(flag, null, 2) + "\n");
}

main();
