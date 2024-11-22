import { Alert as MuiAlert, CircularProgress, Typography } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { AUTH } from "i18n/namespaces";
import { useTranslation } from "react-i18next";
import makeStyles from "utils/makeStyles";

import PushNotificationSettings from "./notifications/PushNotificationSettings";
import ChangePhone from "./phone/ChangePhone";
import useAccountInfo from "./useAccountInfo";
import StrongVerification from "./verification/StrongVerification";

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
      {isAccountInfoLoading ? (
        <CircularProgress />
      ) : accountInfoError ? (
        <MuiAlert severity="error">{accountInfoError.message}</MuiAlert>
      ) : (
        <>
          <PushNotificationSettings className={classes.section} />
          <StrongVerification
            className={classes.section}
            accountInfo={accountInfo!}
          />
          <ChangePhone className={classes.section} accountInfo={accountInfo!} />
        </>
      )}
    </>
  );
}
