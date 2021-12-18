import { Typography } from "@material-ui/core";
import { GetAccountInfoRes } from "proto/account_pb";
import dayjs from "utils/dayjs";

import makeStyles from "../../../utils/makeStyles";
import {
  TIMEZONE,
  TIMEZONE_HELPER,
  YOUR_LOCAL_TIME_IS,
  YOUR_TIMEZONE,
} from "../constants";

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(4, 0),
  },
  timezone: {
    marginBottom: 0,
  },
}));

export default function Timezone(accountInfo: GetAccountInfoRes.AsObject) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Typography variant="h2">{TIMEZONE}</Typography>
      <Typography className={classes.timezone} variant="body1" paragraph>
        {YOUR_TIMEZONE} <b>{accountInfo.timezone}</b>
        {YOUR_LOCAL_TIME_IS}{" "}
        <b>{dayjs().tz(accountInfo.timezone).format("LT")}</b>.
      </Typography>
      <Typography variant="body1">{TIMEZONE_HELPER}</Typography>
    </div>
  );
}
