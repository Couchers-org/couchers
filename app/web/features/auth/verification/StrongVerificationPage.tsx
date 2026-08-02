import NfcIcon from "@mui/icons-material/Nfc";
import PhonelinkSetupIcon from "@mui/icons-material/PhonelinkSetup";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import { Box, Container, Divider, List, ListItem, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { OpenInNewIcon } from "components/Icons";
import PageTitle from "components/PageTitle";
import StyledLink from "components/StyledLink";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { InitiateStrongVerificationRes } from "proto/account_pb";
import { service } from "service";
import { theme } from "theme";
import { useIsNativeEmbed } from "utils/nativeLink";

export default function StrongVerificationInstructions() {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, AUTH]);
  const isNativeEmbed = useIsNativeEmbed();

  const {
    error,
    isPending,
    mutate: startStrongVerification,
  } = useMutation<InitiateStrongVerificationRes.AsObject, RpcError>({
    mutationFn: () => service.account.initiateStrongVerification(),
    onSuccess: async (data) => {
      if (isNativeEmbed) {
        // In the WebView, window.open() is unreliable. Using location.href
        // triggers handleShouldStartLoad which opens the URL in the system
        // browser via Linking.openURL() while keeping the WebView in place.
        window.location.href = data.redirectUrl;
      } else {
        // Open Iris ID in a new tab so user can keep these instructions open
        window.open(data.redirectUrl, "_blank");
      }
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

        <Box
          sx={{
            backgroundColor: "var(--mui-palette-grey-50)",
            borderRadius: theme.shape.borderRadius,
            padding: theme.spacing(3),
            marginBottom: theme.spacing(3),
            marginTop: theme.spacing(3),
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
            <PhonelinkSetupIcon sx={{ fontSize: 28, color: "var(--mui-palette-primary-main)" }} />
            <Typography variant="h3">{t("auth:strong_verification.instructions.before_you_start.heading")}</Typography>
          </Box>
          <Box
            component="ul"
            sx={{
              marginTop: theme.spacing(1),
              marginBottom: 0,
              paddingLeft: theme.spacing(3),
              "& li": { marginBottom: theme.spacing(1) },
            }}
          >
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.before_you_start.nfc_check" />
            </li>
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.before_you_start.passport_check" />
            </li>
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.before_you_start.remove_case" />
            </li>
          </Box>
        </Box>

        <Typography variant="h2" sx={{ marginBottom: theme.spacing(2), marginTop: theme.spacing(3) }}>
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
              <Trans i18nKey="auth:strong_verification.instructions.step1" />
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                marginTop: 1,
                marginBottom: 1,
              }}
            >
              <Trans i18nKey="auth:strong_verification.instructions.step1_apple_note" />
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
              <a href="https://apps.apple.com/app/id1575142357" target="_blank" rel="noopener noreferrer">
                <img
                  src={`/img/app-store-badge/${locale}.svg`}
                  alt={t("auth:strong_verification.instructions.download_app_store")}
                  style={{ height: "30px", width: "auto" }}
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=seismic.rarity"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`/img/google-play-badge/${locale}.svg`}
                  alt={t("auth:strong_verification.instructions.download_google_play")}
                  style={{ height: "30px", width: "auto" }}
                />
              </a>
            </Box>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">
              <Trans i18nKey="auth:strong_verification.instructions.step2" />
            </Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">{t("auth:strong_verification.instructions.step3")}</Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">{t("auth:strong_verification.instructions.step4")}</Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">
              <Trans i18nKey="auth:strong_verification.instructions.step5" />
            </Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">{t("auth:strong_verification.instructions.step6")}</Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">
              <Trans i18nKey="auth:strong_verification.instructions.step7" />
            </Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">{t("auth:strong_verification.instructions.step8")}</Typography>
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
            <NfcIcon sx={{ fontSize: 28, color: "var(--mui-palette-primary-main)" }} />
            <Typography variant="h3">{t("auth:strong_verification.instructions.chip_location.heading")}</Typography>
          </Box>
          <Typography variant="body1" sx={{ marginBottom: theme.spacing(1) }}>
            {t("auth:strong_verification.instructions.chip_location.description")}
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
              <Trans i18nKey="auth:strong_verification.instructions.chip_location.us_germany_mexico" />
            </li>
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.chip_location.finland_germany_new" />
            </li>
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.chip_location.australia" />
            </li>
          </Box>
        </Box>

        <Box
          sx={{
            backgroundColor: "var(--mui-palette-grey-50)",
            borderRadius: theme.shape.borderRadius,
            padding: theme.spacing(3),
            marginBottom: theme.spacing(4),
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
            <TipsAndUpdatesIcon sx={{ fontSize: 28, color: "var(--mui-palette-primary-main)" }} />
            <Typography variant="h3">{t("auth:strong_verification.instructions.scanning_tips.heading")}</Typography>
          </Box>
          <Typography variant="body1" sx={{ marginBottom: theme.spacing(1) }}>
            {t("auth:strong_verification.instructions.scanning_tips.description")}
          </Typography>
          <Box
            component="ul"
            sx={{
              marginTop: theme.spacing(1),
              marginBottom: 0,
              paddingLeft: theme.spacing(3),
              "& li": { marginBottom: theme.spacing(1) },
            }}
          >
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.scanning_tips.remove_case" />
            </li>
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.scanning_tips.hold_still" />
            </li>
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.scanning_tips.flat_surface" />
            </li>
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.scanning_tips.nfc_location" />
            </li>
            <li>
              <Trans i18nKey="auth:strong_verification.instructions.scanning_tips.no_metal" />
            </li>
            <li>{t("auth:strong_verification.instructions.scanning_tips.retry")}</li>
          </Box>
        </Box>

        <Divider sx={{ marginBottom: theme.spacing(3) }} />

        <Box sx={{ marginBottom: theme.spacing(4) }}>
          <Typography variant="h2" sx={{ marginBottom: theme.spacing(2) }}>
            {t("auth:strong_verification.instructions.didnt_work.heading")}
          </Typography>
          <Box
            component="ul"
            sx={{
              paddingLeft: theme.spacing(3),
              "& li": { marginBottom: theme.spacing(1) },
            }}
          >
            <li>{t("auth:strong_verification.instructions.didnt_work.tip1")}</li>
            <li>{t("auth:strong_verification.instructions.didnt_work.tip2")}</li>
            <li>{t("auth:strong_verification.instructions.didnt_work.tip3")}</li>
            <li>{t("auth:strong_verification.instructions.didnt_work.tip4")}</li>
          </Box>
          <Typography variant="body1">
            <Trans
              i18nKey="auth:strong_verification.instructions.didnt_work.contact"
              components={{
                1: <StyledLink href="mailto:support@couchers.org?subject=Strong%20Verification%20Help" />,
              }}
            />
          </Typography>
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
          <Button onClick={startStrongVerification} loading={isPending} size="large" endIcon={<OpenInNewIcon />}>
            {t("auth:strong_verification.start_button")}
          </Button>
        </Box>
      </Container>
    </>
  );
}
