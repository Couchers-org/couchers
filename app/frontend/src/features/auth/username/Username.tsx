import { Typography } from "@material-ui/core";
import { GetAccountInfoRes } from "proto/account_pb";

import { USERNAME, USERNAME_HELPER, YOUR_USERNAME_IS } from "../constants";

export default function Username(accountInfo: GetAccountInfoRes.AsObject) {
  return (
    <>
      <Typography variant="h2">{USERNAME}</Typography>
      <Typography variant="body1" paragraph>
        {YOUR_USERNAME_IS} <b>{accountInfo.username}</b>.
      </Typography>
      <Typography variant="body1">{USERNAME_HELPER}</Typography>
    </>
  );
}
