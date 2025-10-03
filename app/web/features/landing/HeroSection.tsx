import { styled } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Alert from "@/components/Alert";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "@/components/HtmlMeta";
import MapAnimation from "@/components/MapAnimation";
import { useAuthContext } from "@/features/auth/AuthProvider";
import SignupFormContent from "@/features/auth/signup/SignupFormContent";
import CouchersIntroduction from "@/features/landing/CouchersIntroduction";
import { useTranslation } from "@/i18n";
import { AUTH, GLOBAL } from "@/i18n/namespaces";
import { useIsNativeEmbed } from "@/platform/nativeLink";
import { Sentry } from "@/platform/sentry";
import { SIGNUP_ROUTE } from "@/routes";
import serviceClients from "@/serviceClients";
import stringOrFirstString from "@/utils/stringOrFirstString";
import useStablePush from "@/utils/useStablePush";

const StyledContent = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  width: "100%",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(4, 0),

  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

const StyledMobileEmbed = styled("div")(({ theme }) => ({
  margin: theme.spacing(3),
}));

const HeroSection = () => {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const router = useRouter();
  const { authState, authActions } = useAuthContext();
  const error = authState.error;
  const urlToken = stringOrFirstString(router.query.token);
  const isNativeEmbed = useIsNativeEmbed();

  const push = useStablePush();

  const [isLoading, setIsLoading] = useState(false);

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
          await push(SIGNUP_ROUTE);
          return;
        }
        setIsLoading(false);
      }
    })();
  }, [urlToken, authActions, t, push]);

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
      <HtmlMeta title={t("global:join_us")} />
      <StyledContent>
        <CouchersIntroduction />
        <MapAnimation />
      </StyledContent>
    </>
  );
};

export default HeroSection;
