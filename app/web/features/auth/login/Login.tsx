import { styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import HtmlMeta from "components/HtmlMeta";
import StyledLink from "components/StyledLink";
import CouchersIntroduction from "features/landing/CouchersIntroduction";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL, LANDING } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { dashboardRoute, signupRoute } from "routes";
import stringOrFirstString from "utils/stringOrFirstString";

import { useAuthContext } from "../AuthProvider";
import LoginForm from "./LoginForm";

const StyledContent = styled("div")(({ theme }) => ({
  width: "100%",
  height: "100%",
  justifyContent: "center",
  flexDirection: "column",
  padding: theme.spacing(0, 2),

  [theme.breakpoints.up("md")]: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
}));

const StyledFormWrapper = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  width: "100%",
  maxWidth: "400px",
  border: `1px solid ${theme.palette.divider}`,

  [theme.breakpoints.up("md")]: {
    width: "45%",
    marginTop: theme.spacing(2),
  },
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
      router.push(redirectTo);
    }
  }, [authenticated, router, redirectTo]);

  return (
    <>
      <HtmlMeta title={t("auth:login_page.title")} />
      <StyledContent>
        <CouchersIntroduction />
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
              <StyledLink href={signupRoute}>Sign up</StyledLink>
            </Trans>
          </Typography>
        </StyledFormWrapper>
      </StyledContent>
    </>
  );
}
