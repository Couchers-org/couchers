import { Typography } from "@material-ui/core";
import PageTitle from "components/PageTitle";
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
      <PageTitle>{TIMEZONE}</PageTitle>
      <Typography variant="body1" paragraph>
        {YOUR_TIMEZONE} <b>{accountInfo.timezone}</b>
        {YOUR_LOCAL_TIME_IS}{" "}
        <b>{dayjs().tz("America/New_York").format("LT")}</b>.
      </Typography>
      <Typography variant="body1">{TIMEZONE_HELPER}</Typography>
    </>
  );
}
