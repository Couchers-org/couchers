/**
 * Analytics Event Collector
 *
 * Tracks user behavior and app performance by collecting events (page views,
 * button clicks, errors, etc.) and sending them to our backend for analysis.
 *
 * HOW IT WORKS:
 * - Events are queued in the user's browser temporarily
 * - They're sent to the server in batches every 3 seconds
 * - If sending fails, we retry with exponential backoff
 * - When the user leaves the page, remaining events are sent immediately
 *
 * BACKEND INTEGRATION:
 * - Events are sent to the backend's ReportDiagnostics endpoint
 * - Backend stores them permanently in the database for analytics and debugging
 *
 * USAGE:
 * 1. Call initializeCollector() once when your app starts
 * 2. Use logEvent() anywhere to track actions
 * 3. Call destroyCollector() when cleaning up (e.g., on app unmount)
 */

import { DiagnosticEvent, reportDiagnostics } from "service/diagnostics";

const FLUSH_INTERVAL_MS = 3_000;
const MAX_BATCH_SIZE = 100;
const INITIAL_FLUSH_DELAY_MS = 150;
const MAX_BACKOFF_MS = 60_000;

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL)!;

const FRONTEND_VERSION = process.env.NEXT_PUBLIC_VERSION ?? "unknown";

interface QueuedEvent {
  tag: string;
  properties: Record<string, unknown>;
  value: number;
  occurred: Date;
}

// Module-level state
let eventQueue: QueuedEvent[] = [];
let flushTimerId: ReturnType<typeof setTimeout> | null = null;
let hasFlushedOnce = false;
let isDestroyed = false;
let consecutiveFailures = 0;

// Calculate backoff interval based on consecutive failures
function getFlushInterval(): number {
  if (consecutiveFailures === 0) return FLUSH_INTERVAL_MS;
  return Math.min(
    FLUSH_INTERVAL_MS * Math.pow(2, consecutiveFailures),
    MAX_BACKOFF_MS,
  );
}

// Schedule the next flush with current interval
function scheduleFlush(): void {
  if (flushTimerId || isDestroyed) return;

  flushTimerId = setTimeout(() => {
    flushTimerId = null;
    flush();
  }, getFlushInterval());
}

// Convert queued events to diagnostic events format
function toDiagnosticEvents(events: QueuedEvent[]): DiagnosticEvent[] {
  return events.map((event) => ({
    tag: event.tag,
    propertiesJson: JSON.stringify(event.properties),
    value: event.value,
    occurred: event.occurred,
  }));
}

// Send events via gRPC with retry logic
function flush(): void {
  if (eventQueue.length === 0) return;

  const batch = eventQueue.splice(0, MAX_BATCH_SIZE);
  hasFlushedOnce = true;

  const diagnosticEvents = toDiagnosticEvents(batch);

  reportDiagnostics(diagnosticEvents, FRONTEND_VERSION)
    .then(() => {
      consecutiveFailures = 0;
    })
    .catch(() => {
      // On failure, put events back at front of queue for retry
      eventQueue.unshift(...batch);
      consecutiveFailures++;
      if (!isDestroyed && !flushTimerId) {
        scheduleFlush();
      }
    });

  // Schedule next flush if there are remaining events
  if (eventQueue.length > 0 && !flushTimerId && !isDestroyed) {
    scheduleFlush();
  }
}

/**
 * Flush via fetch with keepalive (works during page unload).
 * Falls back to putting events back in queue if fetch fails.
 */
function flushViaBeacon(): void {
  if (eventQueue.length === 0) return;

  const batch = eventQueue.splice(0, MAX_BATCH_SIZE);
  hasFlushedOnce = true;

  const body = JSON.stringify({
    frontendVersion: FRONTEND_VERSION,
    infos: batch.map((event) => ({
      tag: event.tag,
      propertiesJson: JSON.stringify(event.properties),
      value: event.value,
      occurred: event.occurred.toISOString(),
    })),
  });

  try {
    fetch(`${API_BASE_URL}/org.couchers.bugs.Bugs/ReportDiagnostics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body,
    });
  } catch {
    // If fetch fails (e.g. SSR or unsupported), put events back
    eventQueue.unshift(...batch);
  }
}

// Event handlers for page visibility and unload
function handleVisibilityChange(): void {
  if (document.visibilityState === "hidden") {
    flushViaBeacon();
  }
}

function handleBeforeUnload(): void {
  flushViaBeacon();
}

// Initialize event listeners (browser only)
function initializeListeners(): void {
  if (typeof window === "undefined") return;

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("beforeunload", handleBeforeUnload);
}

// Clean up event listeners
function cleanupListeners(): void {
  if (typeof window === "undefined") return;

  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("beforeunload", handleBeforeUnload);
}

/**
 * Track a user action or app event.
 *
 * Use this whenever something meaningful happens that you want to measure
 * (e.g., "page.viewed", "button.clicked", "search.performed").
 *
 * @param eventType - Name of the event (e.g., "page.viewed")
 * @param properties - Additional data about the event (e.g., {path: "/dashboard"})
 * @param value - Numeric value to associate (defaults to 1)
 *
 * @example
 * logEvent("search.performed", { query: "Paris", results: 42 });
 * logEvent("button.clicked", { button_id: "submit" });
 */
export function logEvent(
  eventType: string,
  properties: Record<string, unknown> = {},
  value = 1,
): void {
  if (isDestroyed) return;

  eventQueue.push({
    tag: eventType,
    properties,
    value,
    occurred: new Date(),
  });

  if (!hasFlushedOnce) {
    // Batch the initial events (e.g. session.started + first page.viewed)
    // together with a short delay instead of flushing immediately
    if (!flushTimerId) {
      flushTimerId = setTimeout(() => {
        flushTimerId = null;
        flush();
      }, INITIAL_FLUSH_DELAY_MS);
    }
  } else if (!flushTimerId) {
    scheduleFlush();
  }
}

/**
 * Stop tracking and send any remaining events.
 *
 * Call this when cleaning up (e.g., when unmounting your app's root component).
 * Any events still in the queue will be sent immediately.
 */
export function destroyCollector(): void {
  isDestroyed = true;

  if (flushTimerId) {
    clearTimeout(flushTimerId);
    flushTimerId = null;
  }

  cleanupListeners();
  flushViaBeacon();
}

/**
 * Set up the event collector to start tracking.
 *
 * Call this once when your app starts (typically in your root provider).
 * This enables automatic event flushing when users close their tab or
 * switch away from the page.
 */
export function initializeCollector(): void {
  if (typeof window === "undefined") return;
  initializeListeners();
}

/**
 * Reset the collector to a clean state.
 *
 * FOR TESTING ONLY - clears the queue and resets all internal state.
 * Call this in your test setup to ensure tests don't affect each other.
 */
export function _resetCollectorState(): void {
  eventQueue = [];
  flushTimerId = null;
  hasFlushedOnce = false;
  isDestroyed = false;
  consecutiveFailures = 0;

  // Re-initialize listeners for tests (they may have been cleaned up)
  cleanupListeners();
  initializeListeners();
}
