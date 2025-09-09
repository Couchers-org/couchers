import { Backdrop, styled } from "@mui/material";
import React, { useEffect, useState } from "react";

import Alert from "@/components/Alert";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "@/components/HtmlMeta";
import PageTitle from "@/components/PageTitle";
import Redirect from "@/components/Redirect";
import TextBody from "@/components/TextBody";
import { useAuthContext } from "@/features/auth/AuthProvider";
import CommunityGuidelinesSection from "@/features/auth/jail/CommunityGuidelinesSection";
import LocationSection from "@/features/auth/jail/LocationSection";
import TOSSection from "@/features/auth/jail/TOSSection";
import { useTranslation } from "@/i18n";
import { AUTH } from "@/i18n/namespaces";
import { JailInfoRes } from "@/proto/jail_pb";
import { LOGIN_ROUTE } from "@/routes";
import { service } from "@/service";

import ActivenessProbeSection from "./ActivenessProbeSection";
import ModNoteSection from "./ModNoteSection";

const StyledContainer = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const Jail = () => {
  const { t } = useTranslation(AUTH);

  const { authState, authActions } = useAuthContext();
  const isJailed = authState.jailed;
  const authError = authState.error;
  const isAuthLoading = authState.loading;
  const isAuthenticated = authState.authenticated;

  const [isLoading, setIsLoading] = useState(false);
  const [jailInfo, setJailInfo] = useState<null | JailInfoRes.AsObject>(null);

  useEffect(() => {
    void (async () => {
      // just in case the store is stale
      await authActions.updateJailStatus();
      setIsLoading(true);
      setJailInfo(await service.jail.getJailInfo());
      setIsLoading(false);
    })();
  }, [authActions]);

  const updateJailed = () => {
    void authActions.updateJailStatus();
  };

  if (!isAuthenticated) return <Redirect to={LOGIN_ROUTE} />;

  return (
    <>
      {!isJailed && <Redirect to="/" />}
      <HtmlMeta title={t("jail.title")} />
      <PageTitle>{t("jail.title")}</PageTitle>
      {authError && <Alert severity="error">{authError}</Alert>}
      <StyledContainer>
        <TextBody>{t("jail.description")}</TextBody>
      </StyledContainer>
      <Backdrop open={isLoading || isAuthLoading}>
        <CenteredSpinner />
      </Backdrop>
      {jailInfo?.hasNotAcceptedTos && (
        <StyledContainer>
          <TOSSection updateJailed={updateJailed} />
        </StyledContainer>
      )}
      {jailInfo?.hasPendingModNotes && (
        <StyledContainer>
          <ModNoteSection
            updateJailed={updateJailed}
            pendingModNotes={jailInfo.pendingModNotesList}
          />
        </StyledContainer>
      )}
      {jailInfo?.hasNotAcceptedCommunityGuidelines && (
        <StyledContainer>
          <CommunityGuidelinesSection updateJailed={updateJailed} />
        </StyledContainer>
      )}
      {jailInfo?.needsToUpdateLocation && (
        <StyledContainer>
          <LocationSection updateJailed={updateJailed} />
        </StyledContainer>
      )}
      {jailInfo?.hasPendingActivenessProbe && (
        <StyledContainer>
          <ActivenessProbeSection updateJailed={updateJailed} />
        </StyledContainer>
      )}
    </>
  );
};

export default Jail;
