import NfcIcon from "@mui/icons-material/Nfc";
import { Box, Container, List, ListItem, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { OpenInNewIcon } from "components/Icons";
import PageTitle from "components/PageTitle";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { InitiateStrongVerificationRes } from "proto/account_pb";
import { service } from "service";
import { theme } from "theme";

export default function StrongVerificationInstructions() {
  const { t } = useTranslation([GLOBAL, AUTH]);

  const {
    error,
    isPending,
    mutate: startStrongVerification,
  } = useMutation<InitiateStrongVerificationRes.AsObject, RpcError>({
    mutationFn: () => service.account.initiateStrongVerification(),
    onSuccess: async (data) => {
      // Open Iris ID in a new tab so user can keep these instructions open
      window.open(data.redirectUrl, "_blank");
    },
  });

  return (
    <>
      <HtmlMeta title={t("auth:strong_verification.title")} />
      <Container maxWidth="md" sx={{ marginTop: theme.spacing(3) }}>
        <PageTitle>{t("auth:strong_verification.title")}</PageTitle>

        <Alert severity="warning" sx={{ marginBottom: theme.spacing(3) }}>
          {t("auth:strong_verification.instructions.warning")}
        </Alert>

        <Typography
          variant="h2"
          sx={{ marginBottom: theme.spacing(2), marginTop: theme.spacing(3) }}
        >
          {t("auth:strong_verification.instructions.title")}
        </Typography>

        <List
          sx={{
            listStyleType: "decimal",
            paddingLeft: theme.spacing(3),
            marginBottom: theme.spacing(4),
          }}
        >
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1" sx={{ marginBottom: 1 }}>
              <Trans i18nKey="auth:strong_verification.instructions.step1">
                Download the <strong>IRIS ID</strong> app
              </Trans>
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ marginTop: 1, marginBottom: 1 }}
            >
              <Trans i18nKey="auth:strong_verification.instructions.step1_apple_note">
                <strong>Apple users:</strong> You can skip the download and use
                your browser instead. Just click "Open" when prompted.
              </Trans>
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 0,
                marginTop: 1,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <a
                href="https://apps.apple.com/app/id1575142357"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/img/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg"
                  alt={t(
                    "auth:strong_verification.instructions.download_app_store",
                  )}
                  style={{ height: "30px", width: "auto" }}
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=seismic.rarity"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/img/GetItOnGooglePlay_Badge_Web_color_English.svg"
                  alt={t(
                    "auth:strong_verification.instructions.download_google_play",
                  )}
                  style={{ height: "45px", width: "auto" }}
                />
              </a>
            </Box>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">
              <Trans i18nKey="auth:strong_verification.instructions.step2">
                Click <strong>"Start Strong Verification"</strong> below (opens
                in new tab)
              </Trans>
            </Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">
              {t("auth:strong_verification.instructions.step3")}
            </Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">
              {t("auth:strong_verification.instructions.step4")}
            </Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">
              <Trans i18nKey="auth:strong_verification.instructions.step5">
                Select <strong>Passport</strong> (ID cards not supported)
              </Trans>
            </Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">
              {t("auth:strong_verification.instructions.step6")}
            </Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">
              {t("auth:strong_verification.instructions.step7")}
            </Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">
              {t("auth:strong_verification.instructions.step8")}
            </Typography>
          </ListItem>
        </List>

        <Box
          sx={{
            backgroundColor: "var(--mui-palette-grey-50)",
            borderRadius: theme.shape.borderRadius,
            padding: theme.spacing(3),
            marginBottom: theme.spacing(4),
            marginTop: theme.spacing(4),
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: theme.spacing(1),
              marginBottom: theme.spacing(1),
            }}
          >
            <NfcIcon
              sx={{ fontSize: 28, color: "var(--mui-palette-primary-main)" }}
            />
            <Typography variant="h3">
              {t("auth:strong_verification.instructions.chip_location.heading")}
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ marginBottom: theme.spacing(1) }}>
            {t(
              "auth:strong_verification.instructions.chip_location.description",
            )}
          </Typography>
          <Box
            component="ul"
            sx={{
              marginTop: theme.spacing(1),
              marginBottom: 0,
              paddingLeft: theme.spacing(3),
            }}
          >
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.chip_location.us_germany_mexico">
                <strong>US, Germany (2016), Mexico:</strong> Back page
              </Trans>
            </li>
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.chip_location.finland_germany_new">
                <strong>Finland, Germany (2017+):</strong> Picture page
              </Trans>
            </li>
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.chip_location.australia">
                <strong>Australia:</strong> Middle page (marked with symbol +
                "chip name")
              </Trans>
            </li>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ marginBottom: theme.spacing(2) }}>
            {error.message}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            marginBottom: theme.spacing(4),
          }}
        >
          <Button
            onClick={startStrongVerification}
            loading={isPending}
            size="large"
            endIcon={<OpenInNewIcon />}
          >
            {t("auth:strong_verification.start_button")}
          </Button>
        </Box>
      </Container>
    </>
  );
}
