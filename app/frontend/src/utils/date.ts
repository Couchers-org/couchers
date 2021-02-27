// format a date
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import moment from "moment";

export function formatDate(date: string, short: boolean = false): string {
  return moment(date, "YYYY-MM-DD").format(short ? "D MMM" : "D MMM YYYY");
}

export function timestamp2Date(timestamp: Timestamp.AsObject): Date {
  return new Date(Math.floor(timestamp.seconds * 1e3 + timestamp.nanos / 1e6));
}

export const dateTimeFormatter = new Intl.DateTimeFormat(navigator.language, {
  month: "short",
  year: "numeric",
});
