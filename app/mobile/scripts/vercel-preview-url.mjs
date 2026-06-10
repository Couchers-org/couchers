#!/usr/bin/env node
// Resolve the Vercel preview URL for a commit via the Vercel API, for pointing
// a Dev Tool branch preview's web views at the matching web deployment.
//
// Returns the commit's own immutable per-deployment URL
// (<project>-<hash>-<scope>.vercel.app): it's assigned when the deployment
// record is created — within seconds of the push, while the build still runs —
// and starts serving once the build finishes. The record-creation race with CI
// is covered by a short retry loop. If the commit's deployment failed or was
// skipped, falls back to the branch's latest READY deployment.
//
// Prints the https URL to stdout, or nothing if it can't be resolved; always
// exits 0 so callers can treat the output as optional. Diagnostics go to
// stderr. Requires VERCEL_TOKEN, VERCEL_PROJECT_ID and VERCEL_TEAM_ID in the
// environment; missing config is reported and treated as "not resolved".
//
// Usage:
//   node scripts/vercel-preview-url.mjs --branch <git branch> --sha <commit sha>
//     [--attempts 6] [--delay-seconds 10]

const API = "https://api.vercel.com";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    args[key.slice(2)] = argv[i + 1];
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function vercelGet(path, params, token) {
  const url = new URL(`${API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    throw new Error(`Vercel API ${path} returned ${resp.status}`);
  }
  return resp.json();
}

const FAILED_STATES = ["ERROR", "CANCELED", "DELETED"];

async function resolve({ branch, sha, attempts, delaySeconds, env }) {
  const token = env.VERCEL_TOKEN;
  const projectId = env.VERCEL_PROJECT_ID;
  const teamId = env.VERCEL_TEAM_ID;
  if (!token || !projectId || !teamId) {
    console.error(
      "vercel-preview-url: VERCEL_TOKEN/VERCEL_PROJECT_ID/VERCEL_TEAM_ID not set; skipping",
    );
    return null;
  }

  const base = { projectId, teamId, limit: "1" };
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (attempt > 1) await sleep(delaySeconds * 1000);

    const bySha = await vercelGet(
      "/v6/deployments",
      { ...base, "meta-githubCommitSha": sha },
      token,
    );
    const d = bySha.deployments?.[0];
    if (d) {
      if (!FAILED_STATES.includes(d.state)) return `https://${d.url}`;
      console.error(
        `vercel-preview-url: deployment for ${sha} is ${d.state}; falling back to the branch's latest READY deployment`,
      );
      break;
    }
    console.error(
      `vercel-preview-url: no deployment for ${sha} yet (attempt ${attempt}/${attempts})`,
    );
  }

  const ready = await vercelGet(
    "/v6/deployments",
    { ...base, state: "READY", "meta-githubCommitRef": branch },
    token,
  );
  if (ready.deployments?.length) {
    return `https://${ready.deployments[0].url}`;
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.branch) throw new Error("--branch is required");
  if (!args.sha) throw new Error("--sha is required");

  let url = null;
  try {
    url = await resolve({
      branch: args.branch,
      sha: args.sha,
      attempts: Number(args.attempts ?? 6),
      delaySeconds: Number(args["delay-seconds"] ?? 10),
      env: process.env,
    });
  } catch (e) {
    // a Vercel API outage must not fail the OTA build; the bundle just keeps
    // its build-default web URL
    console.error(`vercel-preview-url: ${e}`);
  }
  if (url) {
    console.error(`vercel-preview-url: resolved ${url}`);
    console.log(url);
  } else {
    console.error("vercel-preview-url: no preview URL resolved");
  }
}

main();
