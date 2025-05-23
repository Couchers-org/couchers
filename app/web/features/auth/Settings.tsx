import { styled } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import ChangeEmail from "features/auth/email/ChangeEmail";
import DoNotEmail from "features/auth/email/DoNotEmail";
import { ChangePassword } from "features/auth/password";
import Section from "features/auth/section/Section";
import Timezone from "features/auth/timezone/Timezone";
import Username from "features/auth/username/Username";
import NotificationSettings from "features/notifications/NotificationSettings";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";

import DeleteAccount from "./deletion/DeleteAccount";
import ManageDonations from "./donations/ManageDonations";
import LoginsLink from "./logins/LoginsLink";
import ChangePhone from "./phone/ChangePhone";
import useAccountInfo from "./useAccountInfo";
import StrongVerification from "./verification/StrongVerification";

const TopMarginWrapper = styled("div")(({ theme }) => ({
  margin: theme.spacing(4, 0),
  "&:first-of-type": {
    marginTop: theme.spacing(2),
  },
}));

const MarginWrapper = styled("div")(({ theme }) => ({
  margin: theme.spacing(4, 0),
}));

export default function Settings() {
  const { t } = useTranslation(AUTH);
  const {
    data: accountInfo,
    error: accountInfoError,
    isLoading: isAccountInfoLoading,
  } = useAccountInfo();

  return (
    <>
      <HtmlMeta title={t("account_settings_page.title")} />
      <PageTitle>{t("account_settings_page.title")}</PageTitle>
      {isAccountInfoLoading ? (
        <CenteredSpinner />
      ) : accountInfoError ? (
        <Alert severity="error">{accountInfoError.message}</Alert>
      ) : accountInfo ? (
        <>
          <TopMarginWrapper>
            <NotificationSettings />
          </TopMarginWrapper>
          <MarginWrapper>
            <StrongVerification accountInfo={accountInfo!} />
          </MarginWrapper>
          <MarginWrapper>
            <ChangePhone accountInfo={accountInfo!} />
          </MarginWrapper>
          <MarginWrapper>
            <ChangeEmail email={accountInfo.email} />
          </MarginWrapper>
          <MarginWrapper>
            <ChangePassword />
          </MarginWrapper>
          <MarginWrapper>
            <LoginsLink />
          </MarginWrapper>
          <MarginWrapper>
            <ManageDonations />
          </MarginWrapper>
          <MarginWrapper>
            <Username username={accountInfo.username} />
          </MarginWrapper>
          <MarginWrapper>
            <Timezone timezone={accountInfo.timezone} />
          </MarginWrapper>
          <MarginWrapper>
            <DoNotEmail />
          </MarginWrapper>
          <MarginWrapper>
            <Section
              title={t("account_settings_page.gender_section.title")}
              content={t("account_settings_page.gender_section.explanation")}
            />
          </MarginWrapper>
          <MarginWrapper>
            <Section
              title={t("account_settings_page.birth_date_section.title")}
              content={t(
                "account_settings_page.birth_date_section.explanation",
              )}
            />
          </MarginWrapper>
          <MarginWrapper>
            <DeleteAccount username={accountInfo.username} />
          </MarginWrapper>
        </>
      ) : null}
    </>
  );
}
