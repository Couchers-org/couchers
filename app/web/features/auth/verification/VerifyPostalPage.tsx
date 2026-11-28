import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import useAccountInfo from "features/auth/useAccountInfo";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { useRouter } from "next/router";
import stringOrFirstString from "utils/stringOrFirstString";

import PostalVerificationSection from "./PostalVerificationSection";
import { DataUseSection, PageWidth, paperBackground } from "./VerificationPage";

export default function VerifyPostalPage() {
  const { t } = useTranslation(AUTH);
  const router = useRouter();
  const { data: accountInfo, error: accountInfoError, isLoading: isAccountInfoLoading } = useAccountInfo();
  const code = stringOrFirstString(router.query.c)?.toUpperCase() ?? "";

  return (
    <>
      <HtmlMeta title={t("verification_page.postal.header")} />
      {paperBackground}
      <PageWidth
        sx={(theme) => ({
          paddingBlock: theme.spacing(3, 4),
          display: "flex",
          flexDirection: "column",
          gap: 4,
        })}
      >
        {isAccountInfoLoading || !router.isReady ? (
          <CenteredSpinner />
        ) : accountInfoError ? (
          <Alert severity="error">{accountInfoError.message}</Alert>
        ) : accountInfo ? (
          <PostalVerificationSection hasDonated={accountInfo.hasDonated} initialCode={code} />
        ) : null}
        <DataUseSection />
      </PageWidth>
    </>
  );
}
