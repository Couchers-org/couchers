import { Container, Typography } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { useRouter } from "next/router";
import stringOrFirstString from "utils/stringOrFirstString";

export default function CompleteStrongVerification() {
  const { t } = useTranslation(AUTH);

  const router = useRouter();
  const verificationAttemptToken = stringOrFirstString(
    router.query.verification_attempt_token,
  );

  console.info("Captured token", verificationAttemptToken);

  return (
    <>
      <HtmlMeta title={t("strong_verification.title")} />
      <Container disableGutters maxWidth="md">
        <PageTitle>{t("strong_verification.complete_title")}</PageTitle>
        <Typography variant="body1" gutterBottom>
          {t("strong_verification.complete_message1")}
        </Typography>
        <Typography variant="body1" gutterBottom>
          {t("strong_verification.complete_message2")}
        </Typography>
        <Typography variant="body1">
          {t("strong_verification.delete_information")}
        </Typography>
      </Container>
    </>
  );
}
