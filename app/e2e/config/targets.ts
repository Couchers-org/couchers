/**
 * A target is "which running app are we pointing at".
 *
 * These mirror the frontend env files in app/web: `next` is what a plain
 * `yarn dev` gives you (.env.development), `localdev` is the docker-compose
 * stack (.env.localdev). Set E2E_TARGET to pick one, or E2E_BASE_URL to point
 * at anything else (a Vercel preview, a colleague's tunnel).
 */

/** Things a target can offer that some recipes and flows require. */
export type Capability =
  /** MailDev is reachable, so signup/verification emails can be read back. */
  | "maildev"
  /** Data is seeded and resettable, so mutations are safe and repeatable. */
  | "seeded-data";

export interface Target {
  id: string;
  /** Where the frontend is served from. */
  baseUrl: string;
  /**
   * True when the backend is on a different site than the frontend, which
   * makes the `couchers-sesh` cookie third-party. See "Getting logged out
   * right after logging in" in app/web/readme.md.
   */
  crossSiteCookies: boolean;
  maildevUrl?: string;
  capabilities: Capability[];
}

const TARGETS: Record<string, Target> = {
  // Default dev setup: local frontend, staging ("next") backend.
  next: {
    id: "next",
    baseUrl: "http://localhost:3000",
    crossSiteCookies: true,
    capabilities: [],
  },
  // Full local stack via `docker compose up` in app/.
  localdev: {
    id: "localdev",
    baseUrl: "http://localhost:3000",
    crossSiteCookies: false,
    maildevUrl: process.env.MAILDEV_URL || "http://localhost:1080",
    capabilities: ["maildev", "seeded-data"],
  },
};

export function resolveTarget(): Target {
  const id = process.env.E2E_TARGET || "next";
  const target = TARGETS[id];
  if (!target) {
    throw new Error(`Unknown E2E_TARGET "${id}". Known targets: ${Object.keys(TARGETS).join(", ")}`);
  }
  return {
    ...target,
    baseUrl: process.env.E2E_BASE_URL || target.baseUrl,
  };
}

export function hasCapability(target: Target, capability: Capability): boolean {
  return target.capabilities.includes(capability);
}
