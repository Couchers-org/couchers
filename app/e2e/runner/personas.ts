import path from "path";

import { Target } from "../config/targets";

/**
 * Who a recipe is logged in as. Each non-anon persona logs in once per run
 * (see specs/auth.setup.ts) and the session is reused via storageState.
 */
export type PersonaName =
  /** Logged out. Needs no credentials, so works against any target. */
  | "anon"
  /** An established member with a filled-in profile, references and messages. */
  | "member";

export const PERSONAS: PersonaName[] = ["anon", "member"];

export interface Credentials {
  username: string;
  password: string;
}

/** The dummy users that app/backend/src/dummy_data.py seeds into a local backend. */
const LOCALDEV_CREDENTIALS: Record<Exclude<PersonaName, "anon">, Credentials> = {
  member: { username: "aapeli", password: "Aapeli's password" },
};

export function credentialsFor(persona: PersonaName, target: Target): Credentials {
  if (persona === "anon") throw new Error("The anon persona has no credentials");

  if (target.id === "localdev") return LOCALDEV_CREDENTIALS[persona];

  const prefix = `E2E_${persona.toUpperCase().replace(/-/g, "_")}`;
  const username = process.env[`${prefix}_USERNAME`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!username || !password) {
    throw new Error(
      `Persona "${persona}" needs credentials on target "${target.id}". ` +
        `Set ${prefix}_USERNAME and ${prefix}_PASSWORD (see app/e2e/readme.md).`,
    );
  }
  return { username, password };
}

/**
 * Whether this persona can log in on this target at all. Checked when tests
 * are collected so recipes needing credentials we don't have are skipped with
 * a useful message, rather than failing at login.
 */
export function credentialsAvailable(persona: PersonaName, target: Target): boolean {
  if (persona === "anon") return true;
  try {
    credentialsFor(persona, target);
    return true;
  } catch {
    return false;
  }
}

export function storageStatePath(persona: PersonaName, target: Target): string {
  return path.join(__dirname, "..", ".auth", `${target.id}-${persona}.json`);
}

/** Playwright's "no cookies, no storage" state, used for anon recipes. */
export const ANON_STORAGE_STATE = { cookies: [], origins: [] };
