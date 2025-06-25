import { styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import Redirect from "components/Redirect";
import StyledLink from "components/StyledLink";
import CouchersIntroduction from "features/landing/CouchersIntroduction";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { useIsNativeEmbed } from "platform/nativeLink";
import Sentry from "platform/sentry";
import { useEffect, useState } from "react";
import { dashboardRoute, loginRoute, signupRoute } from "routes";
import { service } from "service";
import isGrpcError from "service/utils/isGrpcError";
import { theme } from "theme";
import stringOrFirstString from "utils/stringOrFirstString";

import { useAuthContext } from "../AuthProvider";
import SignupFormContent from "./SignupFormContent";

const StyledSection = styled("section")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(2),
  paddingBottom: 0,
  width: "100%",
  height: "100%",

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
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing(2),
  flexDirection: "column",

  [theme.breakpoints.up("md")]: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
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

export default function Signup() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const router = useRouter();

  const { authState, authActions } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;
  const flowState = authState.flowState;

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
      <StyledSection>
        <StyledContent>
          <CouchersIntroduction />
          <StyledFormWrapper>
            {!flowState ? (
              <SignupFormContent />
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

            <Typography sx={{ marginTop: theme.spacing(2) }}>
              <Trans i18nKey="auth:basic_sign_up_form.existing_user_prompt">
                Already have an account?{" "}
                <StyledLink href={loginRoute}>Log in</StyledLink>
              </Trans>
            </Typography>
          </StyledFormWrapper>
        </StyledContent>
      </StyledSection>
    </>
  );
}
