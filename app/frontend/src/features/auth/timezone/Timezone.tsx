import { Typography } from "@material-ui/core";
import PageTitle from "components/PageTitle";
import { GetAccountInfoRes } from "proto/account_pb";

import { TIMEZONE, TIMEZONE_HELPER, YOUR_TIMEZONE } from "../constants";

export default function Timezone(accountInfo: GetAccountInfoRes.AsObject) {
  return (
    <>
      <PageTitle>{TIMEZONE}</PageTitle>
      <>
        <Typography variant="body1">
          {YOUR_TIMEZONE} <b>{accountInfo.timezone}</b>.
        </Typography>
        <Typography variant="body1">{TIMEZONE_HELPER}</Typography>
      </>
    </>
  );
}
