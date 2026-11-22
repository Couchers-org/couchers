import { HostRequest } from "proto/requests_pb";
import { Temporal } from "temporal-polyfill";
import { endOfDay, startOfDay } from "utils/date";

export function hostRequestStartInstant(hostRequest: Pick<HostRequest.AsObject, "fromDate" | "timezone">) {
  return startOfDay(Temporal.PlainDate.from(hostRequest.fromDate), hostRequest.timezone);
}

export function hostRequestEndInstant(hostRequest: Pick<HostRequest.AsObject, "toDate" | "timezone">) {
  return endOfDay(Temporal.PlainDate.from(hostRequest.toDate), hostRequest.timezone);
}

export function isHostRequestPast(hostRequest: Pick<HostRequest.AsObject, "toDate" | "timezone">) {
  return Temporal.Instant.compare(hostRequestEndInstant(hostRequest), Temporal.Now.instant()) <= 0;
}
