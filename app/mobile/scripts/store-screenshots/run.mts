// Seeds realistic data, drives the app on simulators/emulators with Maestro, and frames the screenshots with captions
// at the App Store and Google Play sizes. See README.md.
//
// Usage (from app/mobile): npm run store-screenshots -- [--platform ios|android] [--build] [--compose-only]
import {
  type ChildProcess,
  execFileSync,
  spawn,
  spawnSync,
} from "node:child_process";
import {
  copyFileSync,
  existsSync,
  globSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";

import * as avatars from "./avatars.mts";
import * as covers from "./covers.mts";
import * as frames from "./frames.mts";

const HERE = import.meta.dirname;
const APP = join(HERE, "../../..");
const MOBILE = join(APP, "mobile");
const WEB = join(APP, "web");
const RAW = join(HERE, "raw");
const OUTPUT = join(HERE, "output");

const DEMO_USERNAME = "maya_r";
const DEMO_PASSWORD = "store-screenshots"; // matches backend/src/store_screenshot_data.py
const IOS_APP_ID = "org.couchers.devtool.ios";
const ANDROID_APP_ID = "org.couchers.devtool.android";
const SCHEME = "couchers-devtool";

// order of the screenshots in the listing; Google Play asks for the key UI in the first three and allows at most 8
const SCREENS = [
  "search",
  "profile",
  "messages",
  "community",
  "events",
  "dashboard",
  "inbox",
  "filters",
];

type DeviceKey = "iphone" | "ipad" | "android";
const DEVICES: Record<
  DeviceKey,
  { platform: "ios" | "android"; simulator?: string }
> = {
  iphone: { platform: "ios", simulator: "iPhone 17 Pro Max" },
  ipad: { platform: "ios", simulator: "iPad Pro 13-inch (M5)" },
  android: { platform: "android" },
};

const TARGETS: Record<DeviceKey, frames.Target[]> = {
  iphone: [
    {
      store: "app-store",
      name: "iphone-6.9",
      size: [1320, 2868],
      device: frames.IPHONE,
    },
    {
      store: "app-store",
      name: "iphone-6.5",
      size: [1284, 2778],
      device: frames.IPHONE,
    },
  ],
  ipad: [
    {
      store: "app-store",
      name: "ipad-13",
      size: [2064, 2752],
      device: frames.IPAD,
    },
  ],
  android: [
    {
      store: "google-play",
      name: "phone",
      size: [1440, 2560],
      device: frames.ANDROID,
    },
  ],
};

const BUILD_ENV = {
  EXPO_PUBLIC_COUCHERS_ENV: "dev",
  EXPO_PUBLIC_API_BASE_URL: "http://localhost:8888",
  EXPO_PUBLIC_WEB_BASE_URL: "http://localhost:3000",
  EXPO_PUBLIC_STORE_SCREENSHOTS: "1",
  STORE_SCREENSHOTS: "1",
  APP_VARIANT: "devtool",
  SENTRY_DISABLE_AUTO_UPLOAD: "true",
};

function log(message: string) {
  console.log(`\n==> ${message}`);
}

// throws rather than exiting, so the backend and web server are always put back
function fail(message: string): never {
  throw new Error(message);
}

function run(
  cmd: string,
  args: string[],
  options: { cwd?: string; env?: Record<string, string> } = {},
) {
  const result = spawnSync(cmd, args, {
    cwd: options.cwd ?? APP,
    env: { ...process.env, ...options.env },
    stdio: "inherit",
  });
  if (result.status !== 0) fail(`Failed: ${cmd} ${args.join(" ")}`);
}

function output(cmd: string, args: string[], cwd = APP): string {
  return execFileSync(cmd, args, { cwd, encoding: "utf8" });
}

async function httpOk(url: string): Promise<boolean> {
  try {
    await fetch(url, { signal: AbortSignal.timeout(5000), redirect: "manual" });
    return true;
  } catch {
    return false;
  }
}

async function waitFor(url: string, what: string) {
  for (let i = 0; i < 60; i++) {
    if (await httpOk(url)) return;
    await sleep(2000);
  }
  fail(`${what} didn't come up`);
}

// ---------- data ----------

async function seed() {
  log("Preparing avatars and event covers");
  const names = await avatars.prepare();
  await covers.prepare();
  log("Seeding the local database");
  run("docker", [
    ...[
      "compose",
      "exec",
      "-T",
      "-e",
      "PROMETHEUS_MULTIPROC_DIR=/tmp",
      "backend",
    ],
    ...[
      "python",
      "src/store_screenshot_data.py",
      "--names",
      JSON.stringify(names),
    ],
  ]);
}

// ---------- backend ----------

// WebKit drops cookies set with Domain=localhost, so on iOS the session never reaches the app's web views. For the
// duration of the run the backend sends host-only cookies instead (an empty COOKIE_DOMAIN omits the attribute).
const COOKIE_OVERRIDE = `services:
  backend:
    environment:
      COOKIE_DOMAIN: ""
`;

async function startBackendOverride() {
  log("Restarting the backend with host-only cookies");
  const override = join(RAW, "compose.cookies.yml");
  mkdirSync(RAW, { recursive: true });
  writeFileSync(override, COOKIE_OVERRIDE);
  run("docker", [
    "compose",
    "-f",
    "docker-compose.yml",
    "-f",
    override,
    "up",
    "-d",
    "backend",
  ]);
  await waitFor("http://localhost:8888", "The backend");
}

function stopBackendOverride() {
  log("Restoring the backend's normal config");
  run("docker", ["compose", "up", "-d", "backend"]);
}

// ---------- web ----------

// web settings and feature flags that are on locally but not live in production
// (community standing and verification score on profiles)
const NOT_IN_PRODUCTION = ["NEXT_PUBLIC_IS_VERIFICATION_ENABLED"];
const FORCED_FEATURE_FLAGS = { public_trips_enabled: false };

function readEnvFile(path: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

async function startWeb(): Promise<ChildProcess> {
  if (await httpOk("http://localhost:3000")) {
    fail(
      "Something is already running on http://localhost:3000. Stop your web dev server first: the screenshots need " +
        "a production build of the web app pointed at the local backend (the backend only allows that port).",
    );
  }
  // A production build, so dev-only overlays (Next.js indicator, React Query devtools) don't show, with the local
  // settings minus features that aren't live in production
  const env = {
    ...Object.fromEntries(
      Object.entries(readEnvFile(join(WEB, ".env.localdev"))).filter(
        ([key]) => !NOT_IN_PRODUCTION.includes(key),
      ),
    ),
    ASSET_PREFIX: "",
    NEXT_PUBLIC_STORE_SCREENSHOTS: "1",
    NEXT_PUBLIC_STORE_SCREENSHOTS_FORCED_FLAGS:
      JSON.stringify(FORCED_FEATURE_FLAGS),
  };
  log("Building the web app (production build against the local backend)");
  run("yarn", ["build"], { cwd: WEB, env });
  log("Starting the web app on http://localhost:3000");
  // own process group, so stopping it also stops the next-server that yarn starts
  const server = spawn("yarn", ["serve", "-p", "3000"], {
    cwd: WEB,
    env: { ...process.env, ...env },
    stdio: "inherit",
    detached: true,
  });
  await waitFor("http://localhost:3000", "The web app");
  return server;
}

async function stopWeb(server: ChildProcess) {
  const exited = new Promise((resolve) => server.once("exit", resolve));
  process.kill(-server.pid!, "SIGINT");
  await exited;
}

// ---------- devices ----------

// whether this script built the app installed on the device; another build (e.g. a dev client) won't do
const builtHere = (deviceId: string) =>
  existsSync(join(RAW, ".built", deviceId));

function markBuilt(deviceId: string) {
  mkdirSync(join(RAW, ".built"), { recursive: true });
  writeFileSync(join(RAW, ".built", deviceId), "");
}

const hasIosApp = (udid: string) =>
  spawnSync("xcrun", ["simctl", "get_app_container", udid, IOS_APP_ID], {
    stdio: "ignore",
  }).status === 0;

/**
 * There can be several simulators with the same name (one per runtime): prefer one that already has the app, so we
 * don't rebuild, then the newest runtime.
 */
function iosUdid(name: string): string {
  const { devices } = JSON.parse(
    output("xcrun", ["simctl", "list", "devices", "available", "-j"]),
  ) as {
    devices: Record<string, { name: string; udid: string }[]>;
  };
  const matches = Object.entries(devices)
    .flatMap(([runtime, list]) =>
      list
        .filter((d) => d.name === name)
        .map((d) => ({ runtime, udid: d.udid })),
    )
    .map((match) => ({ ...match, hasApp: hasIosApp(match.udid) }))
    .sort(
      (a, b) =>
        Number(a.hasApp) - Number(b.hasApp) ||
        a.runtime.localeCompare(b.runtime),
    );
  if (!matches.length)
    fail(`No iOS simulator named "${name}", create one in Xcode`);
  return matches[matches.length - 1].udid;
}

function prepareIos(udid: string, build: boolean) {
  spawnSync("xcrun", ["simctl", "boot", udid], { stdio: "ignore" });
  output("xcrun", ["simctl", "bootstatus", udid, "-b"]);
  const installed = output("xcrun", ["simctl", "listapps", udid]).includes(
    IOS_APP_ID,
  );
  if (build || !installed || !builtHere(udid)) {
    log(`Building the iOS app for ${udid} (local Xcode build, no EAS)`);
    run(
      "npx",
      [
        "expo",
        "run:ios",
        "--configuration",
        "Release",
        "--device",
        udid,
        "--no-bundler",
      ],
      {
        cwd: MOBILE,
        env: BUILD_ENV,
      },
    );
    markBuilt(udid);
  }
  // the classic 9:41, full signal and battery
  run("xcrun", [
    ...[
      "simctl",
      "status_bar",
      udid,
      "override",
      "--time",
      "9:41",
      "--dataNetwork",
      "wifi",
      "--wifiMode",
      "active",
    ],
    ...["--wifiBars", "3", "--cellularMode", "active", "--cellularBars", "4"],
    ...["--batteryState", "discharging", "--batteryLevel", "100"],
  ]);
}

async function androidSerial(): Promise<string> {
  const devices = output("adb", ["devices"])
    .split("\n")
    .slice(1)
    .filter((line) => line.includes("\tdevice"))
    .map((line) => line.split("\t")[0]);
  if (devices.length) return devices[0];
  const avds = output("emulator", ["-list-avds"]).split("\n").filter(Boolean);
  if (!avds.length)
    fail("No Android emulator found, create one in Android Studio");
  log(`Starting the ${avds[0]} emulator`);
  spawn("emulator", ["-avd", avds[0], "-no-snapshot-save"], {
    stdio: "ignore",
    detached: true,
  }).unref();
  run("adb", ["wait-for-device"]);
  while (
    output("adb", ["shell", "getprop", "sys.boot_completed"]).trim() !== "1"
  )
    await sleep(2000);
  return androidSerial();
}

function prepareAndroid(serial: string, build: boolean) {
  const adb = ["-s", serial];
  // the emulator reaches the local web app, API and media server through localhost
  for (const port of [3000, 8888, 5001])
    run("adb", [...adb, "reverse", `tcp:${port}`, `tcp:${port}`]);
  const installed = output("adb", [
    ...adb,
    "shell",
    "pm",
    "list",
    "packages",
  ]).includes(ANDROID_APP_ID);
  if (build || !installed || !builtHere(serial)) {
    log("Building the Android app (local Gradle build, no EAS)");
    // applies the store-screenshots config (cleartext http to the local backend) to the native project
    run("npx", ["expo", "prebuild", "--platform", "android", "--no-install"], {
      cwd: MOBILE,
      env: BUILD_ENV,
    });
    // expo wants the emulator's name rather than its adb serial
    const avdName = output("adb", [...adb, "emu", "avd", "name"])
      .split("\n")[0]
      .trim();
    run(
      "npx",
      [
        "expo",
        "run:android",
        "--variant",
        "release",
        "--device",
        avdName,
        "--no-bundler",
      ],
      {
        cwd: MOBILE,
        env: BUILD_ENV,
      },
    );
    markBuilt(serial);
  }
  // demo mode: fixed clock, full signal and battery, no notification icons
  run("adb", [
    ...adb,
    "shell",
    "settings",
    "put",
    "global",
    "sysui_demo_allowed",
    "1",
  ]);
  for (const extras of [
    ["-e", "command", "enter"],
    ["-e", "command", "clock", "-e", "hhmm", "0941"],
    [
      "-e",
      "command",
      "battery",
      "-e",
      "level",
      "100",
      "-e",
      "plugged",
      "false",
    ],
    ["-e", "command", "network", "-e", "wifi", "show", "-e", "level", "4"],
    ["-e", "command", "network", "-e", "mobile", "hide"],
    ["-e", "command", "notifications", "-e", "visible", "false"],
  ]) {
    output("adb", [
      ...adb,
      "shell",
      "am",
      "broadcast",
      "-a",
      "com.android.systemui.demo",
      ...extras,
    ]);
  }
  // demo mode doesn't hide notification icons on newer Android versions, so snooze the notifications for a day
  for (const key of output("adb", [
    ...adb,
    "shell",
    "cmd",
    "notification",
    "list",
  ])
    .split(/\s+/)
    .filter(Boolean)) {
    output("adb", [
      ...adb,
      "shell",
      `cmd notification snooze --for 86400000 '${key}'`,
    ]);
  }
}

// the seeded home community's id, which differs between databases
function homeCommunityId(): string {
  const { name } = JSON.parse(
    readFileSync(avatars.SEED_DATA, "utf8"),
  ).home_community;
  return output("docker", [
    ...["compose", "exec", "-T", "postgres", "psql", "-U", "postgres", "-tAc"],
    `select parent_node_id from clusters where name = '${name}' and is_official_cluster`,
  ]).trim();
}

function capture(deviceKey: DeviceKey, deviceId: string, appId: string) {
  const out = join(RAW, deviceKey);
  rmSync(out, { recursive: true, force: true });
  const maestroOut = join(out, "maestro");
  log(`Taking screenshots on ${deviceKey}`);
  run("maestro", [
    ...[
      "--device",
      deviceId,
      "test",
      "--test-output-dir",
      maestroOut,
      join(HERE, "flow.yaml"),
    ],
    ...[
      "-e",
      `APP_ID=${appId}`,
      "-e",
      `SCHEME=${SCHEME}`,
      "-e",
      `USERNAME=${DEMO_USERNAME}`,
    ],
    ...[
      "-e",
      `PASSWORD=${DEMO_PASSWORD}`,
      "-e",
      `COMMUNITY_ID=${homeCommunityId()}`,
    ],
  ]);
  // maestro saves screenshots inside its test output, under <flow>/takeScreenshot/
  for (const screenshot of globSync("**/takeScreenshot/*.png", {
    cwd: maestroOut,
  })) {
    copyFileSync(join(maestroOut, screenshot), join(out, basename(screenshot)));
  }
}

// ---------- framing ----------

async function compose(deviceKeys: DeviceKey[], locale: string) {
  const captions: Record<string, string> = JSON.parse(
    readFileSync(join(HERE, "captions", `${locale}.json`), "utf8"),
  );
  for (const deviceKey of deviceKeys) {
    for (const target of TARGETS[deviceKey]) {
      log(`Framing ${target.store}/${target.name}`);
      const dir = join(OUTPUT, locale, target.store, target.name);
      // start clean, so screens that were removed or renumbered don't linger
      rmSync(dir, { recursive: true, force: true });
      for (const [i, screen] of SCREENS.entries()) {
        const raw = join(RAW, deviceKey, `${screen}.png`);
        if (!existsSync(raw)) {
          console.log(`  missing ${relative(HERE, raw)}, skipping`);
          continue;
        }
        const out = join(
          dir,
          `${String(i + 1).padStart(2, "0")}-${screen}.png`,
        );
        await frames.write(raw, captions[screen], target, out);
        console.log(`  ${relative(HERE, out)}`);
      }
    }
  }
}

async function main() {
  const { values: args } = parseArgs({
    options: {
      platform: { type: "string" }, // ios or android; default both
      build: { type: "boolean", default: false }, // rebuild the apps even if already installed
      "compose-only": { type: "boolean", default: false }, // only re-frame existing raw screenshots
      "skip-seed": { type: "boolean", default: false }, // don't re-run the seeder
      locale: { type: "string", default: "en" }, // captions/<locale>.json to use
    },
  });
  if (args.platform && !["ios", "android"].includes(args.platform))
    fail("--platform must be ios or android");
  const deviceKeys = (Object.keys(DEVICES) as DeviceKey[]).filter(
    (key) => !args.platform || DEVICES[key].platform === args.platform,
  );

  if (!args["compose-only"]) {
    if (!args["skip-seed"]) await seed();
    let server: ChildProcess | undefined;
    try {
      await startBackendOverride();
      server = await startWeb();
      for (const key of deviceKeys) {
        if (DEVICES[key].platform === "ios") {
          const udid = iosUdid(DEVICES[key].simulator!);
          prepareIos(udid, args.build);
          capture(key, udid, IOS_APP_ID);
        } else {
          const serial = await androidSerial();
          prepareAndroid(serial, args.build);
          capture(key, serial, ANDROID_APP_ID);
        }
      }
    } finally {
      if (server) await stopWeb(server);
      stopBackendOverride();
    }
  }

  await compose(deviceKeys, args.locale);
  log(`Done: ${join(OUTPUT, args.locale)}`);
}

try {
  await main();
} catch (error) {
  console.error(`\n${(error as Error).message}`);
  process.exitCode = 1;
}
