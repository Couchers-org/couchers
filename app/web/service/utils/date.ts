import { Duration } from "dayjs/plugin/duration";
import { Duration as DurationPb } from "google-protobuf/google/protobuf/duration_pb";

export function duration2pb(duration: Duration) {
  const d = new DurationPb();
  d.setSeconds(duration.asSeconds());
  d.setNanos(duration.milliseconds() * 1000);
  return d;
}
export type { Duration };
