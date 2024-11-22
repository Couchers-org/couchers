import { Divider, styled, Typography, TypographyProps } from "@mui/material";
import Alert from "components/Alert";
import HtmlMeta from "components/HtmlMeta";
import StyledLink from "components/StyledLink";
import mobileAuthBg from "features/auth/resources/mobile-auth-bg.jpg";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useEffect } from "react";
import vercelLogo from "resources/vercel.svg";
import { dashboardRoute, signupRoute } from "routes";
import stringOrFirstString from "utils/stringOrFirstString";

import { useAuthContext } from "../AuthProvider";
import LoginForm from "./LoginForm";

const StyledIntroduction = styled("div")(({ theme }) => ({
  flexShrink: 0,
  color: theme.palette.common.white,
  flexDirection: "column",
  display: "flex",
  textAlign: "left",
  width: "45%",
  maxWidth: theme.breakpoints.values.md / 2,
  marginInlineEnd: "10%",
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

const StyledBackground = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(1, 4),
  paddingBottom: 0,
  background: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("${mobileAuthBg.src}")`,
  backgroundPosition: "top center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  width: "100%",
  height: `calc(100vh - ${theme.shape.navPaddingXs})`,

  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1, 2),
  },

  [theme.breakpoints.up("sm")]: {
    height: `calc(100vh - ${theme.shape.navPaddingSmUp})`,
  },
}));

const StyledContent = styled("div")(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(2),
  [theme.breakpoints.up("md")]: {
    display: "flex",
    flexDirection: "row",
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
}));

const StyledTitle = styled(Typography)<TypographyProps>(({ theme }) => ({
  [theme.breakpoints.up("md")]: {
    fontSize: "2rem",
    lineHeight: "1.15",
    textAlign: "left",
  },
}));

const StyledSubtitle = styled(Typography)<TypographyProps>(({ theme }) => ({
  [theme.breakpoints.up("md")]: {
    display: "inline-block",
    marginTop: theme.spacing(4),
    position: "relative",
  },
}));

const StyledFormWrapper = styled("div")(({ theme }) => ({
  flexShrink: 0,
  backgroundColor: "#fff",
  borderRadius: theme.shape.borderRadius,
  [theme.breakpoints.up("md")]: {
    width: "45%",
    padding: theme.spacing(5, 8),
  },
  [theme.breakpoints.down("md")]: {
    width: "80%",
    padding: theme.spacing(5, 8),
    margin: theme.spacing(2, "auto"),
  },
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    padding: theme.spacing(3, 4),
    margin: theme.spacing(0),
  },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  borderTop: `5px solid ${theme.palette.primary.main}`,
  boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
  left: theme.spacing(1),
  position: "absolute",
  width: "100%",
}));

const StyledVercelLink = styled("a")(({ theme }) => ({
  marginTop: theme.spacing(2),
  [theme.breakpoints.up("md")]: {
    position: "absolute",
    right: theme.spacing(2),
    bottom: theme.spacing(2),
    "& img": { height: "2.5rem" },
  },
  textAlign: "center",
  "& img": { height: "2rem" },
}));

export default function Login() {
  const { t } = useTranslation([AUTH, GLOBAL]);
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
      <StyledBackground>
        <StyledContent>
          <StyledIntroduction>
            <StyledTitle variant="h1" component="span">
              {t("auth:introduction_title")}
            </StyledTitle>
            <StyledSubtitle variant="h2" component="span">
              {t("auth:introduction_subtitle")}
              <StyledDivider />
            </StyledSubtitle>
          </StyledIntroduction>
          <StyledFormWrapper>
            <Typography variant="h1" gutterBottom>
              {t("auth:login_page.header")}
            </Typography>
            {error && (
              <Alert severity="error" sx={{ width: "100%" }}>
                {error}
              </Alert>
            )}
            <LoginForm />
            <Typography variant="body1">
              <Trans t={t} i18nKey="auth:login_page.no_account_prompt">
                No account yet?{" "}
                <StyledLink href={signupRoute}>Sign up</StyledLink>
              </Trans>
            </Typography>
          </StyledFormWrapper>
        </StyledContent>
        {process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod" && (
          <StyledVercelLink
            rel="noopener noreferrer"
            href="https://vercel.com?utm_source=couchers-org&utm_campaign=oss"
          >
            <img alt={t("auth:vercel_logo_alt_text")} src={vercelLogo.src} />
          </StyledVercelLink>
        )}
      </StyledBackground>
    </>
  );
}
