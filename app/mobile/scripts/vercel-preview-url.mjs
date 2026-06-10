#!/usr/bin/env node
// Resolve the Vercel preview URL for a branch via the Vercel API, for pointing
// a Dev Tool branch preview's web views at the matching web deployment.
//
// Preference order:
//   1. the stable branch alias (<project>-git-<branch>-<scope>.vercel.app) of
//      the branch's newest READY deployment — it tracks the branch's latest
//      successful deploy, so a kept-around Dev Tool bundle stays fresh;
//   2. that deployment's own URL if no branch alias is assigned;
//   3. the URL of a still-building deployment for the exact commit (it starts
//      serving once the build finishes — covers a branch's first push).
//
// The deployment record appears within seconds of the push even though the
// build takes minutes, so a short retry loop covers the race with CI.
//
// Prints the https URL to stdout, or nothing if it can't be resolved; always
// exits 0 so callers can treat the output as optional. Diagnostics go to
// stderr. Requires VERCEL_TOKEN, VERCEL_PROJECT_ID and VERCEL_TEAM_ID in the
// environment; missing config is reported and treated as "not resolved".
//
// Usage:
//   node scripts/vercel-preview-url.mjs --branch <git branch> [--sha <commit sha>]
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

async function branchAliasUrl(deployment, teamId, token) {
  const data = await vercelGet(
    `/v2/deployments/${deployment.uid}/aliases`,
    { teamId },
    token,
  );
  const branchAlias = (data.aliases ?? []).find((a) =>
    a.alias?.includes("-git-"),
  );
  return `https://${branchAlias ? branchAlias.alias : deployment.url}`;
}

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
  let pending = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (attempt > 1) await sleep(delaySeconds * 1000);

    const ready = await vercelGet(
      "/v6/deployments",
      { ...base, state: "READY", "meta-githubCommitRef": branch },
      token,
    );
    if (ready.deployments?.length) {
      return branchAliasUrl(ready.deployments[0], teamId, token);
    }

    if (sha) {
      const bySha = await vercelGet(
        "/v6/deployments",
        { ...base, "meta-githubCommitSha": sha },
        token,
      );
      const d = bySha.deployments?.[0];
      if (d && !["ERROR", "CANCELED", "DELETED"].includes(d.state)) {
        pending = d;
      }
    }
    console.error(
      `vercel-preview-url: no READY deployment for ${branch} yet (attempt ${attempt}/${attempts})`,
    );
  }

  if (pending) {
    console.error(
      `vercel-preview-url: falling back to in-progress deployment ${pending.uid} (${pending.state})`,
    );
    return `https://${pending.url}`;
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.branch) throw new Error("--branch is required");

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
