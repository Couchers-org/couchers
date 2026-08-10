/**
 * Search session ID and click-referrer storage backed by sessionStorage.
 *
 * The search session ID rolls over after 30 minutes of inactivity. The click
 * referrer captures the (session, query, result) triple at the moment the user
 * clicks a search result so downstream pages (profile, host request form) can
 * attribute their events back to the originating search.
 */

const SESSION_KEY = "search.session";
const REFERRER_KEY = "search.referrer";
const SESSION_TTL_MS = 30 * 60 * 1000;

interface StoredSession {
  id: string;
  lastActiveAt: number;
}

/**
 * Random 128-bit hex string. getRandomValues() works in insecure contexts,
 * unlike the other Web Crypto random helpers.
 */
function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface SearchReferrer {
  searchSessionId: string;
  searchQueryId: string;
  resultId: string;
  userId: number;
  setAt: number;
}

function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeSession(s: StoredSession): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    // sessionStorage unavailable (private mode, quota) — drop silently
  }
}

export function getOrCreateSearchSessionId(): string {
  const now = Date.now();
  const existing = readSession();
  if (existing && now - existing.lastActiveAt < SESSION_TTL_MS) {
    writeSession({ id: existing.id, lastActiveAt: now });
    return existing.id;
  }
  const id = randomToken();
  writeSession({ id, lastActiveAt: now });
  return id;
}

export function makeSearchQueryId(): string {
  return randomToken();
}

export function makeResultId(searchQueryId: string, userId: number, position: number): string {
  return `${searchQueryId}:${userId}:${position}`;
}

export function setSearchReferrer(referrer: Omit<SearchReferrer, "setAt">): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(REFERRER_KEY, JSON.stringify({ ...referrer, setAt: Date.now() }));
  } catch {
    // sessionStorage unavailable — drop silently
  }
}

export function readSearchReferrer(userId: number): SearchReferrer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(REFERRER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SearchReferrer;
    if (parsed.userId !== userId) return null;
    if (Date.now() - parsed.setAt > SESSION_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function referrerToProperties(referrer: SearchReferrer | null): Record<string, unknown> {
  if (!referrer) return {};
  return {
    referrer_search_session_id: referrer.searchSessionId,
    referrer_search_query_id: referrer.searchQueryId,
    referrer_result_id: referrer.resultId,
  };
}
