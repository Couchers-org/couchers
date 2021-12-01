import { Typography } from "@material-ui/core";
import { GetAccountInfoRes } from "proto/account_pb";
import dayjs from "utils/dayjs";

import {
  TIMEZONE,
  TIMEZONE_HELPER,
  YOUR_LOCAL_TIME_IS,
  YOUR_TIMEZONE,
} from "../appConstants";

type TimezoneProps = GetAccountInfoRes.AsObject & {
  className?: string;
};

export default function Timezone(props: TimezoneProps) {
  const { className } = props;
  return (
    <div className={className}>
      <Typography variant="h2">{TIMEZONE}</Typography>
      <Typography variant="body1">
        {YOUR_TIMEZONE} <b>{props.timezone}</b>
        {YOUR_LOCAL_TIME_IS} <b>{dayjs().tz(props.timezone).format("LT")}</b>.
      </Typography>
      <Typography variant="body1">{TIMEZONE_HELPER}</Typography>
    </div>
  );
}
