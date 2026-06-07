#!/usr/bin/env node
// Restamp + sign a staged ota-stage.mjs multipart manifest in place. The id is
// restamped because expo-updates skips updates whose id matches the installed
// one; createdAt is restamped because it's the client's newest-wins key.
// Usage: node scripts/ota-sign.mjs --dir <dir> --key-file <pem> --key-id staging

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ALG = "rsa-v1_5-sha256";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    args[key.slice(2)] = argv[i + 1];
  }
  return args;
}

function parseBoundary(contentType) {
  const marker = "boundary=";
  const i = contentType.indexOf(marker);
  if (i === -1) throw new Error(`no boundary in content-type: ${contentType}`);
  return contentType
    .slice(i + marker.length)
    .trim()
    .replace(/^"|"$/g, "");
}

function restampManifest(raw, boundary) {
  const i = raw.indexOf('name="manifest"');
  if (i === -1) throw new Error("manifest part not found in multipart body");
  const hdrEnd = raw.indexOf("\r\n\r\n", i);
  if (hdrEnd === -1) throw new Error("malformed manifest part headers");
  const bodyStart = hdrEnd + 4;
  const bodyEnd = raw.indexOf(`\r\n--${boundary}`, bodyStart);
  if (bodyEnd === -1)
    throw new Error("manifest part body terminator not found");

  const manifest = JSON.parse(
    raw.subarray(bodyStart, bodyEnd).toString("utf8"),
  );
  manifest.id = crypto.randomUUID();
  manifest.createdAt = new Date().toISOString();
  const newBody = Buffer.from(JSON.stringify(manifest));

  return {
    manifest,
    raw: Buffer.concat([
      raw.subarray(0, bodyStart),
      newBody,
      raw.subarray(bodyEnd),
    ]),
  };
}

function signMultipart(raw, boundary, key, keyId) {
  const i = raw.indexOf('name="manifest"');
  if (i === -1) throw new Error("manifest part not found in multipart body");
  const hdrEnd = raw.indexOf("\r\n\r\n", i);
  if (hdrEnd === -1) throw new Error("malformed manifest part headers");
  const bodyStart = hdrEnd + 4;
  const bodyEnd = raw.indexOf(`\r\n--${boundary}`, bodyStart);
  if (bodyEnd === -1)
    throw new Error("manifest part body terminator not found");

  const body = raw.subarray(bodyStart, bodyEnd);
  const sig = crypto
    .sign("sha256", body, { key, padding: crypto.constants.RSA_PKCS1_PADDING })
    .toString("base64");
  const headerValue = `sig="${sig}", keyid="${keyId}", alg="${ALG}"`;

  return Buffer.concat([
    raw.subarray(0, hdrEnd),
    Buffer.from(`\r\nexpo-signature: ${headerValue}`),
    raw.subarray(hdrEnd),
  ]);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const dir = path.resolve(args.dir ?? "");
  const keyId = args["key-id"] ?? "staging";
  if (!args.dir) throw new Error("--dir is required");
  if (!args["key-file"]) throw new Error("--key-file is required");

  const key = crypto.createPrivateKey(
    fs.readFileSync(path.resolve(args["key-file"])),
  );
  const manifestPath = path.join(dir, "manifest");
  const contentType = fs
    .readFileSync(path.join(dir, "manifest.content-type"), "utf8")
    .trim();
  const boundary = parseBoundary(contentType);

  const raw = fs.readFileSync(manifestPath);
  if (raw.includes("expo-signature:")) {
    throw new Error(`manifest already signed: ${manifestPath}`);
  }
  const { manifest, raw: restamped } = restampManifest(raw, boundary);
  const signed = signMultipart(restamped, boundary, key, keyId);
  fs.writeFileSync(manifestPath, signed);

  console.log(`signed ${manifestPath} (keyid=${keyId}, alg=${ALG})`);
  console.log(`  id         ${manifest.id}`);
  console.log(`  createdAt  ${manifest.createdAt}`);
}

main();
