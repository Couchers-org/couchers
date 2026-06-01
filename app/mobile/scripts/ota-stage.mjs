#!/usr/bin/env node
// Stage an `expo export` output into the layout we serve for per-branch Dev Tool
// OTA previews, and generate the Expo Updates manifest for it.
//
// The manifest content (asset key/hash/contentType, launchAsset, id derivation)
// mirrors Expo's reference `custom-expo-updates-server` exactly, so it loads on a
// stock expo-updates client. The wire framing (plain JSON vs multipart/mixed) is
// the one thing still confirmed on-device in Phase 2 — this script emits the
// manifest object as JSON; packaging is applied at serve/upload time.
//
// Usage:
//   node scripts/ota-stage.mjs \
//     --platform ios \
//     --runtime-version <fingerprint> \
//     --base-url https://<sha>--ota.preview.couchershq.org \
//     [--dist dist] [--out ota-out] [--expo-config expo-config.json] [--created-at <iso>]
//
// Produces <out>/<platform>/{manifest.json, bundle.hbc, assets/<key>}, ready to
// `aws s3 cp --recursive` to s3://couchers-dev-assets/ota/<sha>/<platform>/.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const CONTENT_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
  json: "application/json",
  js: "application/javascript",
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    args[key.slice(2)] = argv[i + 1];
  }
  return args;
}

function sha256Base64Url(buf) {
  return crypto
    .createHash("sha256")
    .update(buf)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function md5Hex(buf) {
  return crypto.createHash("md5").update(buf).digest("hex");
}

// sha256 hex of metadata.json -> deterministic UUID, exactly as the reference does.
function sha256HexToUuid(buf) {
  const h = crypto.createHash("sha256").update(buf).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

function assetMetadata({
  distDir,
  filePath,
  ext,
  isLaunchAsset,
  baseUrl,
  platform,
  outDir,
  staged,
}) {
  const abs = path.join(distDir, filePath);
  const buf = fs.readFileSync(abs);
  const key = md5Hex(buf);
  const contentType = isLaunchAsset
    ? "application/javascript"
    : (CONTENT_TYPES[ext] ?? "application/octet-stream");
  const fileExtension = `.${isLaunchAsset ? "bundle" : ext}`;

  const servedName = isLaunchAsset ? "bundle.hbc" : path.join("assets", key);
  const dest = path.join(outDir, servedName);
  if (!staged.has(dest)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    staged.add(dest);
  }

  return {
    hash: sha256Base64Url(buf),
    key,
    fileExtension,
    contentType,
    url: `${baseUrl}/${platform}/${servedName.split(path.sep).join("/")}`,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const platform = args.platform;
  const runtimeVersion = args["runtime-version"];
  const baseUrl = (args["base-url"] ?? "").replace(/\/$/, "");
  if (!["ios", "android"].includes(platform)) {
    throw new Error(`--platform must be ios or android (got ${platform})`);
  }
  if (!runtimeVersion) throw new Error("--runtime-version is required");
  if (!baseUrl) throw new Error("--base-url is required");

  const distDir = path.resolve(args.dist ?? "dist");
  const outRoot = path.resolve(args.out ?? "ota-out");
  const outDir = path.join(outRoot, platform);
  fs.mkdirSync(outDir, { recursive: true });

  const metadataBuf = fs.readFileSync(path.join(distDir, "metadata.json"));
  const metadata = JSON.parse(metadataBuf.toString("utf8"));
  const pf = metadata.fileMetadata?.[platform];
  if (!pf)
    throw new Error(
      `No fileMetadata for platform ${platform} in metadata.json`,
    );

  let expoClient = {};
  if (args["expo-config"]) {
    expoClient = JSON.parse(
      fs.readFileSync(path.resolve(args["expo-config"]), "utf8"),
    );
  } else {
    console.warn(
      "WARN: no --expo-config given; extra.expoClient will be empty {}",
    );
  }

  const staged = new Set();
  const assets = pf.assets.map((a) =>
    assetMetadata({
      distDir,
      filePath: a.path,
      ext: a.ext,
      isLaunchAsset: false,
      baseUrl,
      platform,
      outDir,
      staged,
    }),
  );
  const launchAsset = assetMetadata({
    distDir,
    filePath: pf.bundle,
    ext: null,
    isLaunchAsset: true,
    baseUrl,
    platform,
    outDir,
    staged,
  });

  const manifest = {
    id: sha256HexToUuid(metadataBuf),
    createdAt: args["created-at"] ?? new Date().toISOString(),
    runtimeVersion,
    launchAsset,
    assets,
    metadata: {},
    extra: { expoClient },
  };

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  // Emit the protocol-v1 multipart/mixed framing that the dev client requires, as
  // a static file S3 can serve verbatim, plus the content-type (with the matching
  // boundary) for the uploader to set. Framing matches the on-device-verified
  // local server (a `manifest` part + an `extensions` part).
  const boundary = "COUCHERS_OTA_BOUNDARY";
  const part = (name, body, ct) =>
    `--${boundary}\r\n` +
    `content-disposition: form-data; name="${name}"\r\n` +
    `content-type: ${ct}\r\n\r\n` +
    `${body}\r\n`;
  const multipart =
    part(
      "manifest",
      JSON.stringify(manifest),
      "application/json; charset=utf-8",
    ) +
    part(
      "extensions",
      JSON.stringify({ assetRequestHeaders: {} }),
      "application/json",
    ) +
    `--${boundary}--\r\n`;
  fs.writeFileSync(path.join(outDir, "manifest"), multipart);
  fs.writeFileSync(
    path.join(outDir, "manifest.content-type"),
    `multipart/mixed; boundary=${boundary}`,
  );

  // GitHub strips custom-scheme (couchers-devtool://) links from comments, so the PR
  // comment links to this https page, which redirects to the dev-launcher deep link
  // once opened on the device.
  const manifestUrl = `${baseUrl}/${platform}/manifest`;
  const deepLink =
    "couchers-devtool://expo-development-client/?url=" +
    encodeURIComponent(manifestUrl);
  const openHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Open in Dev Tool</title>
<script>location.replace(${JSON.stringify(deepLink)})</script>
</head>
<body style="font-family: sans-serif; text-align: center; margin-top: 3em">
<p>Opening this branch in the Dev Tool… <a href="${deepLink}">tap here if nothing happens</a>.</p>
</body>
</html>
`;
  fs.writeFileSync(path.join(outDir, "open.html"), openHtml);

  console.log(`staged ${platform} -> ${outDir}`);
  console.log(`  id              ${manifest.id}`);
  console.log(`  runtimeVersion  ${runtimeVersion}`);
  console.log(
    `  launchAsset     ${launchAsset.key} (${launchAsset.contentType})`,
  );
  console.log(
    `  assets          ${assets.length} entries, ${staged.size - 1} unique files`,
  );
  console.log(
    `  manifest.json   ${path.join(outDir, "manifest.json")} (object, for local server)`,
  );
  console.log(
    `  manifest        ${path.join(outDir, "manifest")} (multipart body, for S3)`,
  );
  console.log(
    `  open.html       ${path.join(outDir, "open.html")} (https -> deep link redirect)`,
  );
}

main();
