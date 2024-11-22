import { Divider, styled, Typography, TypographyProps } from "@mui/material";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HtmlMeta from "components/HtmlMeta";
import Redirect from "components/Redirect";
import StyledLink from "components/StyledLink";
import mobileAuthBg from "features/auth/resources/mobile-auth-bg.jpg";
import CommunityGuidelinesForm from "features/auth/signup/CommunityGuidelinesForm";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useIsNativeEmbed } from "platform/nativeLink";
import Sentry from "platform/sentry";
import { useEffect, useState } from "react";
import vercelLogo from "resources/vercel.svg";
import { dashboardRoute, loginRoute, signupRoute, tosRoute } from "routes";
import { service } from "service";
import isGrpcError from "service/utils/isGrpcError";
import stringOrFirstString from "utils/stringOrFirstString";

import { useAuthContext } from "../AuthProvider";
import AccountForm from "./AccountForm";
import BasicForm from "./BasicForm";
import FeedbackForm from "./FeedbackForm";
import ResendVerificationEmailForm from "./ResendVerificationEmailForm";

const StyledAgreement = styled(Typography)<TypographyProps>(({ theme }) => ({
  textAlign: "center",
  [theme.breakpoints.up("md")]: {
    marginTop: theme.spacing(3),
    textAlign: "left",
  },
}));

const StyledScrollingContent = styled("div")(({ theme }) => ({
  position: "relative",
  zIndex: 2,
  justifyContent: "center",
  minHeight: `calc(100vh - ${theme.shape.navPaddingXs})`,
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(1, 4),
  paddingBottom: 0,

  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1, 2),
  },
  [theme.breakpoints.up("sm")]: {
    minHeight: `calc(100vh - ${theme.shape.navPaddingSmUp})`,
  },
}));

const StyledMobileEmbed = styled("div")(({ theme }) => ({
  margin: theme.spacing(3),
}));

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
  position: "fixed",
  left: 0,
  right: 0,
  top: theme.shape.navPaddingXs,
  bottom: 0,
  zIndex: 1,

  [theme.breakpoints.up("sm")]: {
    height: `calc(100vh - ${theme.shape.navPaddingSmUp})`,
    top: theme.shape.navPaddingSmUp,
  },

  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(1, 2),
    position: "absolute",
    background: `linear-gradient(rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 1)), url("${mobileAuthBg.src}")`,
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
  flexGrow: 1,
  alignSelf: "flex-start",
  marginTop: theme.spacing(10),
  marginBottom: theme.spacing(4),

  [theme.breakpoints.up("md")]: {
    alignSelf: "flex-end",
    width: "45%",
    padding: theme.spacing(5, 8),
  },

  [theme.breakpoints.down("md")]: {
    width: "100%",
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

function CurrentForm() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState } = useAuthContext();
  const state = authState.flowState;
  if (!state || state.needBasic) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {t("auth:basic_sign_up_form.header")}
        </Typography>
        {!state && (
          <Typography gutterBottom>
            <Trans i18nKey="auth:basic_sign_up_form.existing_user_prompt">
              Already have an account?{" "}
              <StyledLink href={loginRoute}>Log in</StyledLink>
            </Trans>
          </Typography>
        )}
        <BasicForm />
        <StyledAgreement variant="body1">
          <Trans i18nKey="auth:basic_sign_up_form.sign_up_agreement_explainer">
            By continuing, you agree to our{" "}
            <StyledLink href={tosRoute} target="_blank">
              Terms of Service
            </StyledLink>
            , including our cookie, email, and data handling policies.
          </Trans>
        </StyledAgreement>
      </>
    );
  } else if (state.needAccount) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {t("auth:account_form.header")}
        </Typography>
        <AccountForm />
      </>
    );
  } else if (state.needAcceptCommunityGuidelines) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {t("auth:community_guidelines_form.header")}
        </Typography>
        <CommunityGuidelinesForm />
      </>
    );
  } else if (state.needFeedback) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {t("auth:feedback_form.header")}
        </Typography>
        <FeedbackForm />
      </>
    );
  } else if (state.needVerifyEmail) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {t("auth:sign_up_need_verification_title")}
        </Typography>
        <ResendVerificationEmailForm />
      </>
    );
  } else if (state.authRes) {
    return (
      <>
        <Typography variant="h1" gutterBottom>
          {t("auth:sign_up_completed_title")}
        </Typography>
        <Typography variant="body1">
          {t("auth:sign_up_confirmed_prompt")}
        </Typography>
      </>
    );
  } else {
    throw Error(t("auth:unhandled_sign_up_state"));
  }
}

export default function Signup() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState, authActions } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const urlToken = stringOrFirstString(router.query.token);

  const isNativeEmbed = useIsNativeEmbed();

  useEffect(() => {
    authActions.clearError();
  }, [authActions]);

  useEffect(() => {
    if (authState.error) window.scroll({ top: 0, behavior: "smooth" });
  }, [authState.error]);

  useEffect(() => {
    (async () => {
      if (urlToken) {
        setLoading(true);
        try {
          authActions.updateSignupState(
            await service.auth.signupFlowEmailToken(urlToken)
          );
        } catch (err) {
          Sentry.captureException(err, {
            tags: {
              component: "auth/signup/Signup",
            },
          });
          authActions.authError(
            isGrpcError(err) ? err.message : t("global:error.fatal_message")
          );
          router.push(signupRoute);
          return;
        }
        setLoading(false);
      }
    })();
    // next-router-mock router isn't memoized, so putting router in the dependencies
    // causes infinite looping in tests
  }, [urlToken, authActions, t]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isNativeEmbed) {
    return (
      <StyledMobileEmbed>
        {error && (
          <Alert severity="error" sx={{ width: "100%" }}>
            {error}
          </Alert>
        )}
        {loading ? <CircularProgress /> : <CurrentForm />}
      </StyledMobileEmbed>
    );
  }

  return (
    <>
      {authenticated && <Redirect to={dashboardRoute} />}
      <HtmlMeta title={t("global:sign_up")} />
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
          <div
            style={{
              //this div is to match the flex layout on the login page
              width: "45%",
            }}
          ></div>
        </StyledContent>
      </StyledBackground>
      <StyledScrollingContent>
        <StyledFormWrapper>
          {error && (
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          )}
          {loading ? <CircularProgress /> : <CurrentForm />}
        </StyledFormWrapper>
        {process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod" && (
          <StyledVercelLink
            rel="noopener noreferrer"
            href="https://vercel.com?utm_source=couchers-org&utm_campaign=oss"
          >
            <img alt={t("auth:vercel_logo_alt_text")} src={vercelLogo.src} />
          </StyledVercelLink>
        )}
      </StyledScrollingContent>
    </>
  );
}
