import { Typography } from "@material-ui/core";
import { GetAccountInfoRes } from "proto/account_pb";
import dayjs from "utils/dayjs";

import {
  TIMEZONE,
  TIMEZONE_HELPER,
  YOUR_LOCAL_TIME_IS,
  YOUR_TIMEZONE,
} from "../constants";

export default function Timezone(accountInfo: GetAccountInfoRes.AsObject) {
  return (
    <>
      <Typography variant="h2">{TIMEZONE}</Typography>
      <Typography variant="body1" paragraph>
        {YOUR_TIMEZONE} <b>{accountInfo.timezone}</b>
        {YOUR_LOCAL_TIME_IS}{" "}
        <b>{dayjs().tz(accountInfo.timezone).format("LT")}</b>.
      </Typography>
      <Typography variant="body1">{TIMEZONE_HELPER}</Typography>
    </>
  );
}
