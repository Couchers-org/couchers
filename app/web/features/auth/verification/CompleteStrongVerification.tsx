import { Container, Typography } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import stringOrFirstString from "utils/stringOrFirstString";

export default function CompleteStrongVerification() {
  const { t } = useTranslation([AUTH, GLOBAL]);

  const router = useRouter();
  const verificationAttemptToken = stringOrFirstString(
    router.query.verification_attempt_token
  );

  console.info("Captured token", verificationAttemptToken);

  return (
    <>
      <HtmlMeta title={t("auth:strong_verification.title")} />
      <Container disableGutters maxWidth="md">
        <PageTitle>{t("auth:strong_verification.complete_title")}</PageTitle>
        <Typography variant="body1">
          {t("auth:strong_verification.complete_message")}
        </Typography>
      </Container>
    </>
  );
}
