import { alpha, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import HtmlMeta from "components/HtmlMeta";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL, LANDING } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useEffect } from "react";
import CouchersTextLogo from "resources/CouchersTextLogo";
import { dashboardRoute, signupRoute } from "routes";
import stringOrFirstString from "utils/stringOrFirstString";

import { useAuthContext } from "../AuthProvider";
import LoginForm from "./LoginForm";

const StyledContent = styled("div")(({ theme }) => ({
  width: "100%",
  height: "100%",
  padding: theme.spacing(0, 2),
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
}));

const StyledFormWrapper = styled("div")(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.light, 0.1),
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  width: "100%",
  maxWidth: "600px",
  border: `1px solid ${theme.palette.divider}`,
  marginTop: theme.spacing(2),
}));

export default function Login() {
  const { t } = useTranslation([AUTH, GLOBAL, LANDING]);
  const { authState } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;

  const router = useRouter();
  const from = stringOrFirstString(router.query.from) ?? dashboardRoute;
  const redirectTo = from === "/" || from === "%2F" ? dashboardRoute : from;

  useEffect(() => {
    if (authenticated) {
      // Get the NEXT_LOCALE cookie to use the user's preferred language
      const nextLocale =
        typeof document !== "undefined"
          ? document.cookie
              .split("; ")
              .find((row) => row.startsWith("NEXT_LOCALE="))
              ?.split("=")[1]
          : null;

      const targetLocale = nextLocale || router.locale || "en";

      // Navigate to destination with user's preferred locale
      router.push(redirectTo, undefined, { locale: targetLocale });
    }
  }, [authenticated, router, redirectTo]);

  return (
    <>
      <HtmlMeta title={t("auth:login_page.title")} />
      <StyledContent>
        <CouchersTextLogo />
        <StyledFormWrapper>
          <Typography gutterBottom sx={{ fontSize: "1.4rem", fontWeight: "bold" }}>
            {t("auth:login_page.header")}
          </Typography>
          {error && error !== "logged_out_message" && (
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          )}
          <LoginForm />
          <Typography sx={{ marginTop: 2 }}>
            <Trans
              t={t}
              i18nKey="auth:login_page.no_account_prompt"
              components={{
                2: <StyledLink href={signupRoute} />,
              }}
            ></Trans>
          </Typography>
        </StyledFormWrapper>
      </StyledContent>
    </>
  );
}
