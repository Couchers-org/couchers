import { Alert as MuiAlert, styled, Typography } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { AUTH } from "i18n/namespaces";
import { useTranslation } from "react-i18next";

import PushNotificationSettings from "../notifications/PushNotificationSettings";
import useAccountInfo from "./useAccountInfo";

const MarginWrapper = styled("div")(({ theme }) => ({
  margin: theme.spacing(4, 0),
}));

export default function FeaturePreview() {
  const { t } = useTranslation(AUTH);

  const { error: accountInfoError, isLoading: isAccountInfoLoading } =
    useAccountInfo();

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
        <CenteredSpinner />
      ) : accountInfoError ? (
        <MuiAlert severity="error">{accountInfoError.message}</MuiAlert>
      ) : (
        <>
          <MarginWrapper>
            <PushNotificationSettings />
          </MarginWrapper>
        </>
      )}
    </>
  );
}
