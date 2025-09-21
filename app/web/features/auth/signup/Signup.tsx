import { Container, Typography, alpha, styled } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Alert from "@/components/Alert";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "@/components/HtmlMeta";
import Redirect from "@/components/Redirect";
import StyledLink from "@/components/StyledLink";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { Trans, useTranslation } from "@/i18n";
import { AUTH, GLOBAL } from "@/i18n/namespaces";
import { useIsNativeEmbed } from "@/platform/nativeLink";
import { Sentry } from "@/platform/sentry";
import CouchersTextLogo from "@/resources/CouchersTextLogo";
import { DASHBOARD_ROUTE, LOGIN_ROUTE, SIGNUP_ROUTE } from "@/routes";
import serviceClients from "@/serviceClients";
import { theme } from "@/theme";
import stringOrFirstString from "@/utils/stringOrFirstString";

import SignupFormContent from "./SignupFormContent";

const StyledMobileEmbed = styled("div")(({ theme }) => ({
  margin: theme.spacing(3),
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

const Signup = () => {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const router = useRouter();

  const { authState, authActions } = useAuthContext();
  const isAuthenticated = authState.isAuthenticated;
  const error = authState.error;
  const [isLoading, setIsLoading] = useState(false);

  const urlToken = stringOrFirstString(router.query.token);

  const isNativeEmbed = useIsNativeEmbed();

  useEffect(() => {
    authActions.clearError();
  }, [authActions]);

  useEffect(() => {
    if (authState.error) window.scroll({ top: 0, behavior: "smooth" });
  }, [authState.error]);

  useEffect(() => {
    void (async () => {
      if (urlToken) {
        setIsLoading(true);
        try {
          authActions.updateSignupState(
            await serviceClients.auth.signupFlow({ emailToken: urlToken }),
          );
        } catch (err) {
          Sentry.captureException(err, {
            tags: {
              component: "auth/signup/Signup",
            },
          });

          authActions.authError(err);
          await router.push(SIGNUP_ROUTE);
          return;
        }
        setIsLoading(false);
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
        {isLoading ? <CenteredSpinner /> : <SignupFormContent />}
      </StyledMobileEmbed>
    );
  }

  return (
    <>
      {isAuthenticated && <Redirect to={DASHBOARD_ROUTE} />}
      <HtmlMeta title={t("global:sign_up")} />
      <Container
        component="section"
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: theme.spacing(2),
          height: "100%",
        }}
      >
        <CouchersTextLogo />
        <StyledFormWrapper>
          {error && (
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          )}
          {isLoading ? <CenteredSpinner /> : <SignupFormContent />}
          <Typography sx={{ marginTop: theme.spacing(2) }}>
            <Trans i18nKey="auth:basic_sign_up_form.existing_user_prompt">
              Already have an account?{" "}
              <StyledLink href={LOGIN_ROUTE}>Log in</StyledLink>
            </Trans>
          </Typography>
        </StyledFormWrapper>
      </Container>
    </>
  );
};

export default Signup;
