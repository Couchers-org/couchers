import {
  alpha,
  Box,
  Container,
  Skeleton,
  styled,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import Redirect from "components/Redirect";
import StyledLink from "components/StyledLink";
import LanguagePickerSelect from "features/translate/LanguagePickerSelect";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import Sentry from "platform/sentry";
import { GetInviteCodeInfoRes } from "proto/auth_pb";
import { useEffect, useState } from "react";
import CouchersTextLogo from "resources/CouchersTextLogo";
import { dashboardRoute, loginRoute, signupRoute } from "routes";
import { service } from "service";
import isGrpcError from "service/utils/isGrpcError";
import { theme } from "theme";
import { useIsNativeEmbed } from "utils/nativeLink";
import stringOrFirstString from "utils/stringOrFirstString";

import { useAuthContext } from "../AuthProvider";
import SignupFormContent from "./SignupFormContent";

const StyledFormWrapper = styled("div")(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.light, 0.1),
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  width: "100%",
  maxWidth: "600px",
  border: `1px solid var(--mui-palette-divider)`,
  marginTop: theme.spacing(2),
}));

export default function Signup() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { authState, authActions } = useAuthContext();
  const isNativeEmbed = useIsNativeEmbed();
  const authenticated = authState.authenticated;
  const error = authState.error;

  const [loading, setLoading] = useState(false);

  const urlToken = stringOrFirstString(router.query.token);
  const inviteCode = stringOrFirstString(router.query.code);

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
        } finally {
          setLoading(false);
        }
      }
    })();
    // next-router-mock router isn't memoized, so putting router in the dependencies
    // causes infinite looping in tests
  }, [urlToken, authActions, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    data: inviteInfo,
    error: inviteInfoError,
    isPending: isInvitePending,
  } = useQuery<GetInviteCodeInfoRes.AsObject, RpcError>({
    queryKey: ["inviteCodeInfo", inviteCode],
    queryFn: () => service.auth.getInviteCodeInfo(inviteCode!),
    enabled: !!inviteCode,
    retry: false,
    staleTime: 1000 * 60 * 60, // 1h; invite creator data rarely changes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const inviter = inviteInfo
    ? {
        username: inviteInfo.username,
        name: inviteInfo.name || inviteInfo.username,
        avatarUrl: inviteInfo.avatarUrl,
      }
    : null;
  const inviteError = inviteInfoError?.message ?? null;

  return (
    <>
      {authenticated && !isNativeEmbed && <Redirect to={dashboardRoute} />}
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
          {inviteError && (
            <Alert severity="error" sx={{ width: "100%" }}>
              {t("global:invites.error.fetch_invite_info")}
            </Alert>
          )}
          {inviteCode && !inviteError && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                padding: 1.25,
                border: `1px solid var(--mui-palette-divider)`,
                borderRadius: 2,
                backgroundColor: "var(--mui-palette-background-paper)",
                mb: 2,
              }}
            >
              {inviter && !isInvitePending && (
                <>
                  <Avatar
                    user={{
                      username: inviter.username,
                      name: inviter.name,
                      avatarUrl: inviter.avatarUrl || "",
                    }}
                    highRes
                  />
                  <Typography>
                    {t("global:invites.banner.invited_you", {
                      name: inviter.name,
                    })}
                  </Typography>
                </>
              )}

              {isInvitePending && (
                <>
                  <Skeleton variant="circular" sx={{ width: 48, height: 48 }} />
                  <Skeleton variant="text" sx={{ width: "60%" }} />
                </>
              )}
            </Box>
          )}
          {loading ? (
            <CenteredSpinner />
          ) : (
            <SignupFormContent inviteCode={inviteCode || undefined} />
          )}
          <Typography sx={{ marginTop: theme.spacing(2) }}>
            <Trans i18nKey="auth:basic_sign_up_form.existing_user_prompt">
              Already have an account?{" "}
              <StyledLink href={loginRoute}>Log in</StyledLink>
            </Trans>
          </Typography>
        </StyledFormWrapper>
        {isMobile && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              marginTop: theme.spacing(2),
            }}
          >
            <LanguagePickerSelect />
          </Box>
        )}
      </Container>
    </>
  );
}
