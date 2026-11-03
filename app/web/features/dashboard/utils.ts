import { HostRequest } from "proto/requests_pb";
import { Temporal } from "temporal-polyfill";
import { hostRequestEndInstant, hostRequestStartInstant } from "utils/hostRequests";

export type WhenHappening = "future" | "soon" | "now" | "past";

/** How long before the start of the period do we report it as happening "soon". */
const SOON_DURATION = Temporal.Duration.from({ hours: 48 });

/**
 * Classifies whether a stay is in the future, soon, now, or past relative to the current time.
 * Avoid "today" because it's ambiguous across timezones.
 */
export function classifyWhenHappening(
  hostRequest: Pick<HostRequest.AsObject, "fromDate" | "toDate" | "timezone">,
): WhenHappening {
  const now = Temporal.Now.instant();
  const start = hostRequestStartInstant(hostRequest);
  const end = hostRequestEndInstant(hostRequest);

  if (Temporal.Instant.compare(now, end) >= 0) return "past";
  if (Temporal.Instant.compare(now, start) >= 0) return "now";
  if (Temporal.Instant.compare(start, now.add(SOON_DURATION)) <= 0) return "soon";
  return "future";
}
