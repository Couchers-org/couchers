import { Tooltip } from "@mui/material";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { useTranslation } from "i18n";
import { localizeDateTime, localizeRelativeTime } from "i18n/datetimes";
import { GLOBAL } from "i18n/namespaces";
import { Temporal } from "temporal-polyfill";
import { instantToPlainDateTime, timestampToInstant } from "utils/date";

interface RelativeTimeProps extends React.HTMLAttributes<HTMLTimeElement> {
  instant: Temporal.Instant | Timestamp.AsObject;
  smallestUnit?: Temporal.PluralizeUnit<Temporal.TimeUnit>;
  capitalize?: boolean;
}

/**
 * Unstyled component displaying an instant in time as a relative time (e.g. "3 hours ago"),
 * with a tooltip showing the full date and time.
 */
export default function RelativeTime({ instant, smallestUnit, capitalize, ...rest }: RelativeTimeProps) {
  if (!(instant instanceof Temporal.Instant)) {
    instant = timestampToInstant(instant);
  }
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(GLOBAL);

  const plainDateTime = instantToPlainDateTime(instant);

  return (
    <Tooltip title={localizeDateTime(plainDateTime, locale)} placement="top" arrow>
      <time dateTime={plainDateTime.toString()} {...rest}>
        <>{localizeRelativeTime(instant, locale, { capitalize, smallestUnit, t })}</>
      </time>
    </Tooltip>
  );
}
