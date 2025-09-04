import { Container, Typography, alpha, styled } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Alert from "@/components/Alert";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "@/components/HtmlMeta";
import Redirect from "@/components/Redirect";
import StyledLink from "@/components/StyledLink";
import { Trans, useTranslation } from "@/i18n";
import { AUTH, GLOBAL } from "@/i18n/namespaces";
import { useIsNativeEmbed } from "@/platform/nativeLink";
import Sentry from "@/platform/sentry";
import CouchersTextLogo from "@/resources/CouchersTextLogo";
import { dashboardRoute, loginRoute, signupRoute } from "@/routes";
import { service } from "@/service";
import isGrpcError from "@/service/utils/isGrpcError";
import { theme } from "@/theme";
import stringOrFirstString from "@/utils/stringOrFirstString";

import { useAuthContext } from "../AuthProvider";
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

export default function Signup() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const router = useRouter();

  const { authState, authActions } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;

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
        {loading ? <CenteredSpinner /> : <SignupFormContent />}
      </StyledMobileEmbed>
    );
  }

  return (
    <>
      {authenticated && <Redirect to={dashboardRoute} />}
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
          {loading ? <CenteredSpinner /> : <SignupFormContent />}
          <Typography sx={{ marginTop: theme.spacing(2) }}>
            <Trans i18nKey="auth:basic_sign_up_form.existing_user_prompt">
              Already have an account?{" "}
              <StyledLink href={loginRoute}>Log in</StyledLink>
            </Trans>
          </Typography>
        </StyledFormWrapper>
      </Container>
    </>
  );
}
