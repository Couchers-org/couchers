import { Button as MuiButton, Typography } from "@material-ui/core";
import { Alert as MuiAlert } from "@material-ui/lab/";
import Alert from "components/Alert";
import { Error as GrpcError } from "grpc-web";
import { GetAccountInfoRes } from "proto/account_pb";
import { accountInfoQueryKey } from "queryKeys";
import React from "react";
import { useQuery } from "react-query";
import { Link as RouterLink } from "react-router-dom";
import { routeToEditProfile, settingsRoute } from "routes";
import { service } from "service";
import makeStyles from "utils/makeStyles";

import {
  CLICK_HERE_TO_EDIT,
  DONT_YOU_HATE,
  FILL_IN_WHO_I_AM,
  PASSWORD_TEXT_1,
  PASSWORD_TEXT_LINK,
  PLEASE_COMPLETE_PROFILE,
  UPLOAD_PHOTO,
} from "./constants";

const useStyles = makeStyles((theme) => ({
  alert: {
    marginBottom: theme.spacing(2),
  },
  settingsButton: {
    marginRight: theme.spacing(1),
  },
}));

export default function DashboardBanners() {
  const classes = useStyles();

  const { data, error } = useQuery<GetAccountInfoRes.AsObject, GrpcError>(
    accountInfoQueryKey,
    service.account.getAccountInfo
  );

  return (
    <>
      {error && <Alert severity="error">{error?.message}</Alert>}
      {data && (
        <>
          {!data.profileComplete && (
            <MuiAlert className={classes.alert} severity="warning">
              <Typography variant="inherit" paragraph>
                {PLEASE_COMPLETE_PROFILE}
              </Typography>
              <Typography variant="inherit">{FILL_IN_WHO_I_AM}</Typography>
              <Typography variant="inherit" paragraph>
                {UPLOAD_PHOTO}
              </Typography>
              <Typography variant="inherit" paragraph>
                <MuiButton
                  variant="contained"
                  color="default"
                  component={RouterLink}
                  to={routeToEditProfile()}
                  role="link"
                >
                  {CLICK_HERE_TO_EDIT}
                </MuiButton>
              </Typography>
              <Typography variant="inherit">{DONT_YOU_HATE}</Typography>
            </MuiAlert>
          )}
          {!data.hasPassword && (
            <MuiAlert className={classes.alert} severity="info">
              <Typography variant="inherit">
                <MuiButton
                  className={classes.settingsButton}
                  variant="contained"
                  color="default"
                  component={RouterLink}
                  to={settingsRoute}
                  role="link"
                >
                  {PASSWORD_TEXT_LINK}
                </MuiButton>
                {PASSWORD_TEXT_1}
              </Typography>
            </MuiAlert>
          )}
        </>
      )}
    </>
  );
}
