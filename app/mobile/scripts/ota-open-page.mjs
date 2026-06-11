#!/usr/bin/env node
// Generate the open.html redirect page for a Dev Tool OTA branch preview.
// GitHub strips custom-scheme (couchers-devtool://) links from comments, so the
// PR comment links to this https page, which redirects to the dev-launcher deep
// link once opened on the device.
//
// Usage:
//   node scripts/ota-open-page.mjs --manifest-url <https manifest url> --out <file>

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
  const manifestUrl = args["manifest-url"];
  const out = args.out;
  if (!manifestUrl) throw new Error("--manifest-url is required");
  if (!out) throw new Error("--out is required");

  const deepLink =
    "couchers-devtool://expo-development-client/?url=" +
    encodeURIComponent(manifestUrl);
  const html = `<!doctype html>
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
  const outPath = path.resolve(out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);

  console.log(`wrote ${outPath}`);
  console.log(`  deep link  ${deepLink}`);
}

main();
