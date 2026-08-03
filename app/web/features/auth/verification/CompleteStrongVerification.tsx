import { Favorite, Security, VolunteerActivism } from "@mui/icons-material";
import { Box, Container, Typography } from "@mui/material";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { useRouter } from "next/router";
import stringOrFirstString from "utils/stringOrFirstString";

export default function CompleteStrongVerification() {
  const { t } = useTranslation(AUTH);

  const router = useRouter();
  const verificationAttemptToken = stringOrFirstString(router.query.verification_attempt_token);

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
        <Typography gutterBottom>{t("strong_verification.delete_information")}</Typography>

        <Box
          sx={{
            mt: 4,
            p: 3,
            bgcolor: "primary.50",
            borderRadius: 2,
            border: 1,
            borderColor: "primary.200",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Security sx={{ color: "primary.main", mr: 1, fontSize: 28 }} />
            <Typography
              sx={{
                color: "primary.main",
                fontWeight: "bold",
              }}
            >
              {t("strong_verification.donation_title")}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
            <Favorite sx={{ color: "error.main", mr: 1.5, mt: 0.5, fontSize: 20 }} />
            <Typography sx={{ flex: 1 }}>{t("strong_verification.donation_message1")}</Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
            <VolunteerActivism sx={{ color: "secondary.main", mr: 1.5, mt: 0.5, fontSize: 20 }} />
            <Typography sx={{ flex: 1 }}>{t("strong_verification.donation_message2")}</Typography>
          </Box>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button
              href="/donate?source=strong-verification-complete"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Favorite />}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
              }}
            >
              {t("strong_verification.donate_button")}
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
}
