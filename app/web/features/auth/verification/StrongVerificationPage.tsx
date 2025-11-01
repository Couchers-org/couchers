import {
  Box,
  Container,
  List,
  ListItem,
  Paper,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
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
            <Typography variant="body1">
              <Trans i18nKey="auth:strong_verification.instructions.step1">
                Click <strong>"Start Strong Verification"</strong> below (opens
                in new tab)
              </Trans>
            </Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">
              {t("auth:strong_verification.instructions.step2")}
            </Typography>
          </ListItem>
          <ListItem sx={{ display: "list-item", paddingY: 0.5 }}>
            <Typography variant="body1">
              <Trans i18nKey="auth:strong_verification.instructions.step3">
                Download the <strong>IRIS ID</strong> app
              </Trans>
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

        <Typography
          variant="h2"
          sx={{ marginBottom: theme.spacing(2), marginTop: theme.spacing(4) }}
        >
          {t("auth:strong_verification.instructions.chip_section.heading")}
        </Typography>

        <Typography variant="body1" sx={{ marginBottom: theme.spacing(3) }}>
          {t("auth:strong_verification.instructions.chip_section.description")}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
            gap: theme.spacing(2),
            marginBottom: theme.spacing(4),
          }}
        >
          {/* Picture Page Box */}
          <Paper
            elevation={2}
            sx={{
              padding: theme.spacing(2),
              borderTop: `4px solid ${theme.palette.primary.main}`,
            }}
          >
            <Typography
              variant="h3"
              sx={{ marginBottom: theme.spacing(2), fontWeight: "bold" }}
            >
              {t(
                "auth:strong_verification.instructions.chip_section.picture_page",
              )}
            </Typography>
            <Typography variant="body1" component="div">
              {t(
                "auth:strong_verification.instructions.chip_section.countries.finland",
              )}
              <br />
              {t(
                "auth:strong_verification.instructions.chip_section.countries.germany_new",
              )}
            </Typography>
          </Paper>

          {/* Back Page Box */}
          <Paper
            elevation={2}
            sx={{
              padding: theme.spacing(2),
              borderTop: `4px solid ${theme.palette.primary.main}`,
            }}
          >
            <Typography
              variant="h3"
              sx={{ marginBottom: theme.spacing(2), fontWeight: "bold" }}
            >
              {t(
                "auth:strong_verification.instructions.chip_section.back_page",
              )}
            </Typography>
            <Typography variant="body1" component="div">
              {t(
                "auth:strong_verification.instructions.chip_section.countries.us",
              )}
              <br />
              {t(
                "auth:strong_verification.instructions.chip_section.countries.germany_old",
              )}
              <br />
              {t(
                "auth:strong_verification.instructions.chip_section.countries.mexico",
              )}
            </Typography>
          </Paper>

          {/* Other Location Box */}
          <Paper
            elevation={2}
            sx={{
              padding: theme.spacing(2),
              borderTop: `4px solid ${theme.palette.primary.main}`,
            }}
          >
            <Typography
              variant="h3"
              sx={{ marginBottom: theme.spacing(2), fontWeight: "bold" }}
            >
              {t("auth:strong_verification.instructions.chip_section.other")}
            </Typography>
            <Typography variant="body1" component="div">
              {t(
                "auth:strong_verification.instructions.chip_section.countries.australia",
              )}
            </Typography>
          </Paper>
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
            onClick={() => startStrongVerification()}
            loading={isPending}
            size="large"
          >
            {t("auth:strong_verification.start_button")}
          </Button>
        </Box>
      </Container>
    </>
  );
}
