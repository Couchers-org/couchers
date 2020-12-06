// format a date
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import moment from "moment";

export function formatDate(date: string): string {
  return moment(date, "YYYY-MM-DD").format("D MMM YYYY");
}

export function timestamp2Date(timestamp: Timestamp.AsObject): Date {
  return new Date(Math.floor(timestamp.seconds * 1e3 + timestamp.nanos / 1e6));
}
