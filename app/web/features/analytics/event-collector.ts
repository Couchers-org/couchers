import { DiagnosticEvent, reportDiagnostics } from "service/diagnostics";

const FLUSH_INTERVAL_MS = 3_000;
const MAX_BATCH_SIZE = 100;
const INITIAL_FLUSH_DELAY_MS = 150;
const MAX_BACKOFF_MS = 60_000;

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL)!;

interface QueuedEvent {
  tag: string;
  properties: Record<string, unknown>;
  value: number;
  occurred: Date;
}

class EventCollector {
  private queue: QueuedEvent[] = [];
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private hasFlushedOnce = false;
  private destroyed = false;
  private consecutiveFailures = 0;

  private readonly frontendVersion: string;

  constructor() {
    this.frontendVersion = process.env.NEXT_PUBLIC_VERSION ?? "unknown";

    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", this.onVisibilityChange);
      window.addEventListener("beforeunload", this.onBeforeUnload);
    }
  }

  logEvent(
    eventType: string,
    properties: Record<string, unknown> = {},
    value = 1,
  ): void {
    if (this.destroyed) return;

    this.queue.push({
      tag: eventType,
      properties,
      value,
      occurred: new Date(),
    });

    if (!this.hasFlushedOnce) {
      // Batch the initial events (e.g. session.started + first page.viewed)
      // together with a short delay instead of flushing immediately
      if (!this.timerId) {
        this.timerId = setTimeout(() => {
          this.timerId = null;
          this.flush();
        }, INITIAL_FLUSH_DELAY_MS);
      }
    } else if (!this.timerId) {
      this.scheduleFlush();
    }
  }

  destroy(): void {
    this.destroyed = true;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (typeof window !== "undefined") {
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
      window.removeEventListener("beforeunload", this.onBeforeUnload);
    }
    this.flushViaBeacon();
  }

  private get currentFlushInterval(): number {
    if (this.consecutiveFailures === 0) return FLUSH_INTERVAL_MS;
    return Math.min(
      FLUSH_INTERVAL_MS * Math.pow(2, this.consecutiveFailures),
      MAX_BACKOFF_MS,
    );
  }

  private scheduleFlush(): void {
    if (this.timerId) return;
    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.flush();
    }, this.currentFlushInterval);
  }

  private flush(): void {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, MAX_BATCH_SIZE);
    this.hasFlushedOnce = true;

    const diagnosticEvents: DiagnosticEvent[] = batch.map((e) => ({
      tag: e.tag,
      propertiesJson: JSON.stringify(e.properties),
      value: e.value,
      occurred: e.occurred,
    }));

    reportDiagnostics(diagnosticEvents, this.frontendVersion)
      .then(() => {
        this.consecutiveFailures = 0;
      })
      .catch(() => {
        // On failure, put events back at front of queue for retry
        this.queue.unshift(...batch);
        this.consecutiveFailures++;
        if (!this.destroyed && !this.timerId) {
          this.scheduleFlush();
        }
      });

    // Schedule next flush if there are remaining events
    if (this.queue.length > 0 && !this.timerId && !this.destroyed) {
      this.scheduleFlush();
    }
  }

  /**
   * Flush via fetch with keepalive (works during page unload).
   * Falls back to the normal gRPC flush if fetch or keepalive is unavailable.
   */
  private flushViaBeacon(): void {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, MAX_BATCH_SIZE);
    this.hasFlushedOnce = true;

    const body = JSON.stringify({
      frontendVersion: this.frontendVersion,
      infos: batch.map((e) => ({
        tag: e.tag,
        propertiesJson: JSON.stringify(e.properties),
        value: e.value,
        occurred: e.occurred.toISOString(),
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
      this.queue.unshift(...batch);
    }
  }

  private onVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      this.flushViaBeacon();
    }
  };

  private onBeforeUnload = (): void => {
    this.flushViaBeacon();
  };
}

// Module-level singleton
const collector = new EventCollector();

export function logEvent(
  eventType: string,
  properties?: Record<string, unknown>,
  value?: number,
): void {
  collector.logEvent(eventType, properties, value);
}

export function destroyCollector(): void {
  collector.destroy();
}

/** @internal Exported for tests only */
export { EventCollector as _EventCollector };
