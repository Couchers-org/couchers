#!/usr/bin/env node
// Phase-2 local test harness for Dev Tool OTA.
//
// Serves a staged `ota-out/<platform>/` (from ota-stage.mjs) to a real device on
// the LAN so we can confirm, on-device, whether the dev launcher loads our
// manifest and in which framing (plain JSON vs multipart/mixed). It:
//   - logs every request + the expo-* headers the launcher actually sends,
//   - content-negotiates the manifest framing (override with ?framing=json|multipart),
//   - rewrites launchAsset/asset URLs to its own host, so no regen on IP change,
//   - serves a landing page with a tappable deep link + QR (open it in Safari on
//     the phone, or scan the QR) to trigger the launcher load.
//
// Usage: node scripts/ota-serve.mjs [--dir ota-out] [--port 8099] [--scheme couchers-devtool]

import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, a) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), a[i + 1]]);
    return acc;
  }, [])
);
const DIR = path.resolve(args.dir ?? "ota-out");
const PORT = parseInt(args.port ?? "8099", 10);
const SCHEME = args.scheme ?? "couchers-devtool";

const LOG_HEADERS = [
  "accept",
  "expo-platform",
  "expo-protocol-version",
  "expo-runtime-version",
  "expo-current-update-id",
  "expo-embedded-update-id",
  "expo-expect-signature",
  "expo-dev-client-id",
  "expo-updates-environment",
  "eas-client-id",
  "user-agent",
];

function platforms() {
  return fs
    .readdirSync(DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(DIR, d.name, "manifest.json")))
    .map((d) => d.name);
}

function loadManifest(platform, host) {
  const raw = JSON.parse(fs.readFileSync(path.join(DIR, platform, "manifest.json"), "utf8"));
  const rewrite = (u) => `http://${host}${new URL(u).pathname}`;
  raw.launchAsset.url = rewrite(raw.launchAsset.url);
  raw.assets = raw.assets.map((a) => ({ ...a, url: rewrite(a.url) }));
  return raw;
}

function contentTypeMap(platform) {
  const m = JSON.parse(fs.readFileSync(path.join(DIR, platform, "manifest.json"), "utf8"));
  const map = new Map();
  for (const a of m.assets) map.set(a.key, a.contentType);
  map.set(path.basename(new URL(m.launchAsset.url).pathname), m.launchAsset.contentType);
  return map;
}

function multipartBody(manifest) {
  const boundary = `----ota${Date.now().toString(16)}`;
  const part = (name, body, contentType) =>
    `--${boundary}\r\n` +
    `content-disposition: form-data; name="${name}"\r\n` +
    `content-type: ${contentType}\r\n\r\n` +
    `${body}\r\n`;
  const body =
    part("manifest", JSON.stringify(manifest), "application/json; charset=utf-8") +
    part("extensions", JSON.stringify({ assetRequestHeaders: {} }), "application/json") +
    `--${boundary}--\r\n`;
  return { body, contentType: `multipart/mixed; boundary=${boundary}` };
}

function logReq(req) {
  const hdrs = LOG_HEADERS.filter((h) => req.headers[h] != null)
    .map((h) => `${h}=${req.headers[h]}`)
    .join("  ");
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}`);
  if (hdrs) console.log(`    ${hdrs}`);
}

function chooseFraming(req, url) {
  const q = url.searchParams.get("framing");
  if (q === "json" || q === "multipart") return q;
  const accept = req.headers["accept"] ?? "";
  if (accept.includes("multipart/mixed") || req.headers["expo-protocol-version"]) return "multipart";
  return "json";
}

function landingPage(host) {
  const links = platforms()
    .map((p) => {
      const manifestUrl = `http://${host}/${p}/manifest`;
      const deepLink = `${SCHEME}://expo-development-client/?url=${encodeURIComponent(manifestUrl)}`;
      return `
      <section>
        <h2>${p}</h2>
        <p><a href="${deepLink}">Open ${p} branch in Dev Tool &rarr;</a></p>
        <div class="qr" data-link="${deepLink.replace(/"/g, "&quot;")}"></div>
        <code>${deepLink}</code>
        <p style="font-size:12px;color:#888">manifest: ${manifestUrl}</p>
      </section>`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OTA test</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<style>body{font-family:-apple-system,system-ui,sans-serif;max-width:520px;margin:32px auto;padding:0 16px;color:#313539}
h2{font-size:18px;margin-top:32px}a{font-size:17px}code{display:block;word-break:break-all;background:#f3f3f3;padding:8px;margin-top:8px;font-size:11px}
.qr{margin:16px 0;display:flex;justify-content:center}</style></head>
<body><h1>Dev Tool OTA test</h1>
<p>Open this page in Safari <b>on the phone</b> and tap the link, or scan the QR.</p>
${links}
<script>document.querySelectorAll(".qr").forEach(function(el){new QRCode(el,{text:el.dataset.link,width:220,height:220});});</script>
</body></html>`;
}

const server = http.createServer((req, res) => {
  logReq(req);
  const host = req.headers.host ?? `localhost:${PORT}`;
  const url = new URL(req.url, `http://${host}`);
  const parts = url.pathname.split("/").filter(Boolean);

  // landing page
  if (url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(landingPage(host));
    return;
  }

  const platform = parts[0];
  if (!platforms().includes(platform)) {
    res.writeHead(404).end("unknown platform");
    return;
  }

  // manifest
  if (parts[1] === "manifest" || parts[1] === "manifest.json") {
    if (req.method === "HEAD") {
      // mirror the reference server: GET-only. Non-2xx HEAD lets the launcher
      // classify this as a published-manifest URL rather than a Metro server.
      res.writeHead(405).end();
      return;
    }
    const manifest = loadManifest(platform, host);
    const framing = chooseFraming(req, url);
    if (framing === "multipart") {
      const { body, contentType } = multipartBody(manifest);
      // OTA_NO_PROTO_HEADERS mimics raw S3, which can set content-type but not
      // arbitrary response headers like expo-protocol-version / expo-sfv-version.
      const headers = { "content-type": contentType, "cache-control": "private, max-age=0" };
      if (!process.env.OTA_NO_PROTO_HEADERS) {
        headers["expo-protocol-version"] = "1";
        headers["expo-sfv-version"] = "0";
      }
      res.writeHead(200, headers);
      console.log(
        `    -> 200 multipart (${body.length} bytes)${process.env.OTA_NO_PROTO_HEADERS ? " [no proto headers / S3-mimic]" : ""}`
      );
      res.end(body);
    } else {
      const body = JSON.stringify(manifest);
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "expo-protocol-version": "0",
        "cache-control": "private, max-age=0",
      });
      console.log(`    -> 200 json (${body.length} bytes)`);
      res.end(body);
    }
    return;
  }

  // bundle / assets
  let filePath = null;
  if (parts[1] === "bundle.hbc") filePath = path.join(DIR, platform, "bundle.hbc");
  else if (parts[1] === "assets" && parts[2]) filePath = path.join(DIR, platform, "assets", parts[2]);

  if (filePath && fs.existsSync(filePath)) {
    const name = path.basename(filePath);
    const ct = contentTypeMap(platform).get(name) ?? "application/octet-stream";
    const buf = fs.readFileSync(filePath);
    res.writeHead(200, { "content-type": ct, "content-length": buf.length });
    console.log(`    -> 200 ${ct} (${buf.length} bytes)`);
    res.end(buf);
    return;
  }

  res.writeHead(404).end("not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`OTA test server on http://0.0.0.0:${PORT}  (platforms: ${platforms().join(", ") || "none"})`);
  console.log(`Open on the phone:  http://<this-mac-LAN-ip>:${PORT}/`);
});
