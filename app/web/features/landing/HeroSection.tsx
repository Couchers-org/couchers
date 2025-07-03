import { styled, useMediaQuery } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import MapAnimation from "components/MapAnimation";
import CouchersIntroduction from "features/landing/CouchersIntroduction";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useIsNativeEmbed } from "platform/nativeLink";
import Sentry from "platform/sentry";
import { useEffect, useState } from "react";
import { signupRoute } from "routes";
import { service } from "service";
import isGrpcError from "service/utils/isGrpcError";
import { theme } from "theme";
import stringOrFirstString from "utils/stringOrFirstString";

import { useAuthContext } from "../auth/AuthProvider";
import SignupFormContent from "../auth/signup/SignupFormContent";

const StyledContent = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  width: "100%",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(2),
  padding: theme.spacing(4, 0),

  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

const StyledMobileEmbed = styled("div")(({ theme }) => ({
  margin: theme.spacing(3),
}));

const StyledMapWrapper = styled("div")(({ theme }) => ({
  width: "55%",
  paddingLeft: theme.spacing(8),

  [theme.breakpoints.down("md")]: {
    width: "100%",
    marginTop: theme.spacing(4),
    paddingLeft: 0,
  },
}));

export default function HeroSection() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const router = useRouter();
  const { authState, authActions } = useAuthContext();
  const error = authState.error;
  const urlToken = stringOrFirstString(router.query.token);
  const isNativeEmbed = useIsNativeEmbed();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);

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

  const routeToSignupPage = () => {
    router.push(signupRoute);
  };

  return (
    <>
      <HtmlMeta title={t("global:join_us")} />
      <StyledContent>
        <CouchersIntroduction />
        <StyledMapWrapper>
          <MapAnimation />
        </StyledMapWrapper>
        {router.pathname === "/" && isMobile && (
          <Button
            onClick={routeToSignupPage}
            size="large"
            color="primary"
            sx={{
              marginTop: 4,
              width: theme.spacing(20),
              fontSize: "1.3rem",
            }}
          >
            {t("global:join_us")}
          </Button>
        )}
      </StyledContent>
    </>
  );
}
