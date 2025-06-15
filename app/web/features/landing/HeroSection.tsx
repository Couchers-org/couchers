import { KeyboardDoubleArrowDown } from "@mui/icons-material";
import { Box, styled,  useMediaQuery } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
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

interface HeroSectionProps {
  scrollToMore?: () => void;
}

const StyledSection = styled("section")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(0, 16),
  paddingBottom: 0,
  width: "100%",
  height: "100%",

  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(0, 2),
    justifyContent: "center",
  },
}));

const StyledMobileEmbed = styled("div")(({ theme }) => ({
  margin: theme.spacing(3),
}));

const StyledContent = styled("div")(({ theme }) => ({
  width: "100%",
  justifyContent: "center",
  marginBottom: theme.spacing(2),
  flexDirection: "column",

  [theme.breakpoints.up("md")]: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
}));

const StyledMapWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
  width: "100%",
  maxWidth: "400px",

  [theme.breakpoints.up("md")]: {
    width: "45%",
    marginTop: theme.spacing(2),
  },
}));

export default function HeroSection({ scrollToMore }: HeroSectionProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { authState, authActions } = useAuthContext();
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
      <HtmlMeta title={t("global:join_us")} />
      <StyledSection>
        <StyledContent>
          <CouchersIntroduction scrollToMore={scrollToMore} />
          <StyledMapWrapper>Map animation goes here</StyledMapWrapper>
          {isMobile && scrollToMore && (
            <Box
              fontSize="large"
              onClick={scrollToMore}
              sx={{
                color: theme.palette.common.black,
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
    </>
  );
}
