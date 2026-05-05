import { Button, styled } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import DarkModeSettings from "features/auth/DarkModeSettings";
import ChangeEmail from "features/auth/email/ChangeEmail";
import DoNotEmail from "features/auth/email/DoNotEmail";
import { ChangePassword } from "features/auth/password";
import Section from "features/auth/section/Section";
import Timezone from "features/auth/timezone/Timezone";
import Username from "features/auth/username/Username";
import NotificationSettings from "features/notifications/NotificationSettings";
import PushNotificationSettings from "features/notifications/PushNotificationSettings";
import LanguagePickerSettings from "features/translate/LanguagePickerSettings";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { useEffect, useState } from "react";
import { sendTestMobilePushNotification } from "service/notifications";
import { useIsNativeEmbed } from "utils/nativeLink";

import DeleteAccount from "./deletion/DeleteAccount";
import ManageDonations from "./donations/ManageDonations";
import LoginsLink from "./logins/LoginsLink";
import ChangePhone from "./phone/ChangePhone";
import PostalVerification from "./postalVerification/PostalVerification";
import useAccountInfo from "./useAccountInfo";
import StrongVerification from "./verification/StrongVerification";
import VolunteerManagement from "./volunteer/VolunteerManagement";

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
  const isNativeEmbed = useIsNativeEmbed();
  // Uncomment to enable test push notification button
  const [testPushLoading, setTestPushLoading] = useState(false);
  const [testPushMessage, setTestPushMessage] = useState<string | null>(null);

  const {
    data: accountInfo,
    error: accountInfoError,
    isLoading: isAccountInfoLoading,
  } = useAccountInfo();

  // Uncomment to enable test push notification button
  const handleTestPush = async () => {
    setTestPushLoading(true);
    setTestPushMessage(null);
    try {
      await sendTestMobilePushNotification();
      setTestPushMessage("✅ Test notification sent! Check your phone.");
    } catch (error) {
      setTestPushMessage(
        "❌ Failed to send test notification: " + (error as Error).message,
      );
    } finally {
      setTestPushLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to the element if there's a hash in the URL
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        // Use a small timeout to ensure the page has fully rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [accountInfo]);

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
            {isNativeEmbed ? null : <PushNotificationSettings />}
          </TopMarginWrapper>
          <MarginWrapper
            style={
              process.env.NODE_ENV === "production" ? { display: "none" } : {}
            }
          >
            <Button
              variant="contained"
              onClick={handleTestPush}
              disabled={testPushLoading}
            >
              {testPushLoading
                ? "Sending..."
                : "🔔 Test Mobile Push Notification"}
            </Button>
            {testPushMessage && (
              <Alert
                severity={
                  testPushMessage.startsWith("✅") ? "success" : "error"
                }
              >
                {testPushMessage}
              </Alert>
            )}
          </MarginWrapper>
          <MarginWrapper>
            <DarkModeSettings />
          </MarginWrapper>
          <MarginWrapper>
            <NotificationSettings />
          </MarginWrapper>
          <MarginWrapper>
            <StrongVerification accountInfo={accountInfo!} />
          </MarginWrapper>
          <MarginWrapper>
            <PostalVerification />
          </MarginWrapper>
          <MarginWrapper>
            <VolunteerManagement accountInfo={accountInfo!} />
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
            <LanguagePickerSettings />
          </MarginWrapper>
          <MarginWrapper id="do-not-email">
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
