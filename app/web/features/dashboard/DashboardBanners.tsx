import { Typography } from "@material-ui/core";
import { Alert as MuiAlert } from "@material-ui/lab/";
import Alert from "components/Alert";
import Button from "components/Button";
import { accountInfoQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { GetAccountInfoRes } from "proto/account_pb";
import React from "react";
import { useQuery } from "react-query";
import { routeToEditProfile, settingsRoute } from "routes";
import { service } from "service";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  alert: {
    marginBottom: theme.spacing(2),
  },
  alertText: { display: "block", marginBottom: theme.spacing(1) },
}));

export default function DashboardBanners() {
  const { t } = useTranslation([DASHBOARD]);
  const classes = useStyles();

  const { data, error } = useQuery<GetAccountInfoRes.AsObject, RpcError>(
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
                {t("dashboard:please_complete_profile")}
              </Typography>
              <Typography variant="inherit">
                {t("dashboard:fill_in_who_i_am")}
              </Typography>
              <Typography variant="inherit" paragraph>
                {t("dashboard:upload_photo")}
              </Typography>
              <Typography variant="inherit" paragraph>
                <Link href={routeToEditProfile()} passHref>
                  <Button component="a" color="default" role="link">
                    {t("dashboard:click_here_to_edit")}
                  </Button>
                </Link>
              </Typography>
              <Typography variant="inherit">
                {t("dashboard:dont_you_hate")}
              </Typography>
            </MuiAlert>
          )}
          {!data.hasPassword && (
            <MuiAlert className={classes.alert} severity="info">
              <Typography className={classes.alertText} variant="inherit">
                {t("dashboard:password_text_1")}
              </Typography>
              <Link href={settingsRoute} passHref>
                <Button component="a" color="default" role="link">
                  {t("dashboard:password_text_link")}
                </Button>
              </Link>
            </MuiAlert>
          )}
        </>
      )}
    </>
  );
}
