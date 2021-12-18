import { Typography } from "@material-ui/core";
import { GetAccountInfoRes } from "proto/account_pb";
import React from "react";
import { useTranslation } from "react-i18next";

import makeStyles from "../../../utils/makeStyles";
import { USERNAME_HELPER, YOUR_USERNAME_IS } from "../constants";

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(4, 0),
  },
  username: {
    marginBottom: 0,
  },
}));

export default function Username(accountInfo: GetAccountInfoRes.AsObject) {
  const { t } = useTranslation("auth");
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography variant="h2">
        {t("account_form.username.field_label")}
      </Typography>
      <Typography className={classes.username} variant="body1" paragraph>
        {YOUR_USERNAME_IS} <b>{accountInfo.username}</b>.
      </Typography>
      <Typography variant="body1">{USERNAME_HELPER}</Typography>
    </div>
  );
}
