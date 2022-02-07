import { CircularProgress, Typography } from "@material-ui/core";
import { Alert, Alert as MuiAlert } from "@material-ui/lab/";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import NotificationSettings from "features/auth/notifications/NotificationSettings";
import { AUTH } from "i18n/namespaces";
import { GetAccountInfoRes } from "proto/account_pb";
import { useTranslation } from "react-i18next";
import makeStyles from "utils/makeStyles";

import ChangePhone from "./phone/ChangePhone";
import useAccountInfo from "./useAccountInfo";

const useStyles = makeStyles((theme) => ({
  section: {
    margin: theme.spacing(4, 0),
  },
}));

export default function FeaturePreview() {
  const classes = useStyles();

  const { t } = useTranslation(AUTH);

  const {
    data: accountInfo,
    error: accountInfoError,
    isLoading: isAccountInfoLoading,
  } = useAccountInfo();

  return (
    <>
      <HtmlMeta title={t("feature_preview.title")} />
      <PageTitle>{t("feature_preview.title")}</PageTitle>
      <Typography variant="body1" paragraph>
        {t("feature_preview.explanation")}
      </Typography>
      <MuiAlert severity="warning">
        <Typography variant="inherit">
          {t("feature_preview.disclaimer")}
        </Typography>
      </MuiAlert>
      <NotificationSettings className={classes.section} />
      {isAccountInfoLoading ? (
        <CircularProgress />
      ) : accountInfoError ? (
        <Alert severity="error">{accountInfoError.message}</Alert>
      ) : (
        <>
          <ChangePhone
            className={classes.section}
            accountInfo={accountInfo!}
          />
        </>
      )}
    </>
  );
}
