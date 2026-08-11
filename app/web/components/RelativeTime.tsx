import { Tooltip } from "@mui/material";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { useTranslation } from "i18n";
import { localizeDateTime, localizeRelativeTime } from "i18n/datetimes";
import { GLOBAL } from "i18n/namespaces";
import { Temporal } from "temporal-polyfill";
import { instantToPlainDateTime, timestampToInstant } from "utils/date";

interface RelativeTimeProps {
  instant: Temporal.Instant | Timestamp.AsObject;
  options?: NonNullable<Parameters<typeof localizeRelativeTime>[2]>;
  className?: string;
}

export default function RelativeTime({ instant, options, className }: RelativeTimeProps) {
  if (!(instant instanceof Temporal.Instant)) {
    instant = timestampToInstant(instant);
  }
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(GLOBAL);

  return (
    <Tooltip title={localizeDateTime(instantToPlainDateTime(instant), locale)} placement="top" arrow>
      <span className={className}>{localizeRelativeTime(instant, locale, { t, ...options })}</span>
    </Tooltip>
  );
}
