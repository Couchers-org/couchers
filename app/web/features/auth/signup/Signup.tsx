import { KeyboardDoubleArrowDown } from "@mui/icons-material";
import { Box, Divider, styled, Typography, useMediaQuery } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import Redirect from "components/Redirect";
import StyledLink from "components/StyledLink";
import mobileAuthBg from "features/auth/resources/mobile-auth-bg.jpg";
import CommunityGuidelinesForm from "features/auth/signup/CommunityGuidelinesForm";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { useIsNativeEmbed } from "platform/nativeLink";
import Sentry from "platform/sentry";
import { useEffect, useState } from "react";
import { dashboardRoute, loginRoute, signupRoute, tosRoute } from "routes";
import { service } from "service";
import isGrpcError from "service/utils/isGrpcError";
import { theme } from "theme";
import stringOrFirstString from "utils/stringOrFirstString";

import { useAuthContext } from "../AuthProvider";
import AccountForm from "./AccountForm";
import BasicForm from "./BasicForm";
import ResendVerificationEmailForm from "./ResendVerificationEmailForm";

interface SignupProps {
  scrollToMore?: () => void;
}

const StyledSection = styled("section")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(2, 16),
  paddingBottom: 0,
  background: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("${mobileAuthBg.src}")`,
  backgroundPosition: "top center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  width: "100%",
  height: `calc(100vh - ${theme.shape.navPaddingXs})`,

  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(1, 2),
    justifyContent: "center",
  },
}));

const StyledMobileEmbed = styled("div")(({ theme }) => ({
  margin: theme.spacing(3),
}));

const StyledContent = styled("div")(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(2),
  justifyContent: "center",
  marginBottom: theme.spacing(2),

  [theme.breakpoints.up("md")]: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
}));

const StyledIntroduction = styled("div")(({ theme }) => ({
  flexShrink: 0,
  color: theme.palette.common.white,
  flexDirection: "column",
  display: "flex",
  textAlign: "left",
  width: "55%",
  maxWidth: theme.breakpoints.values.xl / 2,
  marginInlineEnd: "10%",
  marginTop: theme.spacing(12),
  gap: theme.spacing(2),

  [theme.breakpoints.down("md")]: {
    width: "100%",
    marginTop: theme.spacing(2),
  },
}));

const StyledIntroductionText = styled("div")(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    width: "100%",
    marginBottom: theme.spacing(2),
  },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  borderTop: `4px solid ${theme.palette.primary.main}`,
  boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
  position: "absolute",
  width: "100%",
}));

const StyledFormWrapper = styled("div")(({ theme }) => ({
  backgroundColor: "#FFFAFA",
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  width: "100%",

  [theme.breakpoints.up("md")]: {
    width: "45%",
    marginTop: theme.spacing(2),
  },
}));

function CurrentForm() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState } = useAuthContext();
  const state = authState.flowState;
  if (!state || state.needBasic) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("landing:signup_header")}
        </Typography>
        <Typography gutterBottom sx={{ marginBottom: 2 }}>
          {t("landing:signup_description", { user_count: "55k+" })}
        </Typography>
        <BasicForm submitText="Create Account" />
        <Typography variant="caption">
          <Trans i18nKey="auth:basic_sign_up_form.sign_up_agreement_explainer">
            By continuing, you agree to our{" "}
            <StyledLink
              href={tosRoute}
              target="_blank"
              variant="caption"
              sx={{ fontWeight: 700 }}
            >
              Terms of Service
            </StyledLink>
            , including our cookie, email, and data handling policies.
          </Trans>
        </Typography>
      </>
    );
  } else if (state.needAccount) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("auth:account_form.header")}
        </Typography>
        <AccountForm />
      </>
    );
  } else if (state.needAcceptCommunityGuidelines) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("auth:community_guidelines_form.header")}
        </Typography>
        <CommunityGuidelinesForm />
      </>
    );
  } else if (state.needVerifyEmail) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("auth:sign_up_need_verification_title")}
        </Typography>
        <ResendVerificationEmailForm />
      </>
    );
  } else if (state.authRes) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
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

export default function Signup({ scrollToMore }: SignupProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { authState, authActions } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;
  const flowState = authState.flowState;

  const [isMounted] = useState(false);
  const [loading, setLoading] = useState(false);

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
            await service.auth.signupFlowEmailToken(urlToken),
          );
        } catch (err) {
          Sentry.captureException(err, {
            tags: {
              component: "auth/signup/Signup",
            },
          });
          authActions.authError(
            isGrpcError(err) ? err.message : t("global:error.fatal_message"),
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
        {loading ? <CenteredSpinner /> : <CurrentForm />}
      </StyledMobileEmbed>
    );
  }

  return (
    <StyledSection>
      {authenticated && <Redirect to={dashboardRoute} />}
      <HtmlMeta title={t("global:sign_up")} />
      <StyledContent>
        <StyledIntroduction>
          <StyledIntroductionText>
            <Typography
              variant="h1"
              sx={{
                [theme.breakpoints.down("md")]: {
                  width: "100%",
                  textAlign: "center",
                },
              }}
            >
              {t("landing:introduction_title")}
            </Typography>
             {/** TODO(NA): Bold the word couch surfing */}
            {!isMobile && (
              <>
                <Typography
                  variant="h2"
                  component="span"
                  sx={{
                    display: "inline-block",
                    marginTop: theme.spacing(3),
                    position: "relative",
                    fontWeight: 400,
                  }}
                >
                  {t("landing:introduction_subtitle")}
                </Typography>
                <Typography
                  variant="h3"
                  component="span"
                  sx={{
                    display: "inline-block",
                    position: "relative",
                    fontWeight: 400,
                    marginTop: theme.spacing(3),
                  }}
                >
                  {t("landing:introduction_subtitle2")}
                  <StyledDivider />
                </Typography>
              </>
            )}
          </StyledIntroductionText>
          {!isMobile && scrollToMore && (
            <Button
              onClick={scrollToMore}
              size="large"
              color="secondary"
              sx={{ marginTop: 2, width: theme.spacing(20) }}
            >
              {t("global:read_more")}
            </Button>
          )}
        </StyledIntroduction>
        <StyledFormWrapper>
          {!flowState || !isMounted ? (
            <CurrentForm />
          ) : (
            <Link href={signupRoute} passHref legacyBehavior>
              <Button
                variant="contained"
                color="secondary"
                sx={{ margin: theme.spacing(4, 0) }}
              >
                {t("landing:signup_continue")}
              </Button>
            </Link>
          )}

          <Typography variant="body1" sx={{ marginTop: theme.spacing(2) }}>
            <Trans i18nKey="auth:basic_sign_up_form.existing_user_prompt">
              Already have an account?{" "}
              <StyledLink href={loginRoute}>Log in</StyledLink>
            </Trans>
          </Typography>
        </StyledFormWrapper>
        {isMobile && scrollToMore && (
          <Box
            fontSize="large"
            onClick={scrollToMore}
            sx={{
              color: theme.palette.common.white,
              display: "flex",
              justifyContent: "center",
              marginTop: theme.spacing(4),
            }}
          >
            <KeyboardDoubleArrowDown />
          </Box>
        )}
      </StyledContent>
    </StyledSection>
  );
}
