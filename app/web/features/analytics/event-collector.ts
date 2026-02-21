import { DiagnosticEvent, reportDiagnostics } from "service/diagnostics";

const FLUSH_INTERVAL_MS = 3_000;
const MAX_BATCH_SIZE = 100;

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
      this.flush();
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
    this.flush();
  }

  private scheduleFlush(): void {
    if (this.timerId) return;
    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.flush();
    }, FLUSH_INTERVAL_MS);
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

    reportDiagnostics(diagnosticEvents, this.frontendVersion).catch(() => {
      // On failure, put events back at front of queue for retry
      this.queue.unshift(...batch);
      if (!this.destroyed && !this.timerId) {
        this.scheduleFlush();
      }
    });

    // Schedule next flush if there are remaining events
    if (this.queue.length > 0 && !this.timerId && !this.destroyed) {
      this.scheduleFlush();
    }
  }

  private onVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      this.flush();
    }
  };

  private onBeforeUnload = (): void => {
    this.flush();
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
