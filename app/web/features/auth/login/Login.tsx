import { Typography, alpha, styled } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect } from "react";

import Alert from "@/components/Alert";
import HtmlMeta from "@/components/HtmlMeta";
import StyledLink from "@/components/StyledLink";
import AntibotNote from "@/features/antibot/AntibotNote";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { Trans, useTranslation } from "@/i18n";
import { AUTH, GLOBAL, LANDING } from "@/i18n/namespaces";
import CouchersTextLogo from "@/resources/CouchersTextLogo";
import { DASHBOARD_ROUTE, SIGNUP_ROUTE } from "@/routes";
import stringOrFirstString from "@/utils/stringOrFirstString";

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

const Login = () => {
  const { t } = useTranslation([AUTH, GLOBAL, LANDING]);
  const { authState } = useAuthContext();
  const isAuthenticated = authState.authenticated;
  const error = authState.error;

  const router = useRouter();
  const from = stringOrFirstString(router.query.from) ?? DASHBOARD_ROUTE;
  const redirectTo = from === "/" || from === "%2F" ? DASHBOARD_ROUTE : from;

  useEffect(() => {
    if (isAuthenticated) {
      void router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  return (
    <>
      <HtmlMeta title={t("auth:login_page.title")} />
      <StyledContent>
        <CouchersTextLogo />
        <StyledFormWrapper>
          <Typography
            gutterBottom
            sx={{ fontSize: "1.4rem", fontWeight: "bold" }}
          >
            {t("auth:login_page.header")}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          )}
          <LoginForm />
          <Typography sx={{ marginTop: 2 }}>
            <Trans t={t} i18nKey="auth:login_page.no_account_prompt">
              No account yet?{" "}
              <StyledLink href={SIGNUP_ROUTE}>Sign up</StyledLink>
            </Trans>
          </Typography>
          <Typography variant="caption">
            {" "}
            <AntibotNote />
          </Typography>
        </StyledFormWrapper>
      </StyledContent>
    </>
  );
};

export default Login;
