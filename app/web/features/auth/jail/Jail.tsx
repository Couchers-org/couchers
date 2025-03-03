import { Backdrop, styled } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import Redirect from "components/Redirect";
import TextBody from "components/TextBody";
import { useAuthContext } from "features/auth/AuthProvider";
import CommunityGuidelinesSection from "features/auth/jail/CommunityGuidelinesSection";
import LocationSection from "features/auth/jail/LocationSection";
import TOSSection from "features/auth/jail/TOSSection";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { JailInfoRes } from "proto/jail_pb";
import React, { useEffect, useState } from "react";
import { loginRoute } from "routes";
import { service } from "service";

import ActivenessProbeSection from "./ActivenessProbeSection";
import ModNoteSection from "./ModNoteSection";

const StyledContainer = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

export default function Jail() {
  const { t } = useTranslation(AUTH);

  const { authState, authActions } = useAuthContext();
  const isJailed = authState.jailed;
  const authError = authState.error;
  const authLoading = authState.loading;
  const isAuthenticated = authState.authenticated;

  const [loading, setLoading] = useState(false);
  const [jailInfo, setJailInfo] = useState<null | JailInfoRes.AsObject>(null);

  useEffect(() => {
    (async () => {
      //just in case the store is stale
      authActions.updateJailStatus();
      setLoading(true);
      setJailInfo(await service.jail.getJailInfo());
      setLoading(false);
    })();
  }, [authActions]);

  const updateJailed = () => {
    authActions.updateJailStatus();
  };

  if (!isAuthenticated) return <Redirect to={loginRoute} />;

  return (
    <>
      {!isJailed && <Redirect to="/" />}
      <HtmlMeta title={t("jail.title")} />
      <PageTitle>{t("jail.title")}</PageTitle>
      {authError && <Alert severity="error">{authError}</Alert>}
      <StyledContainer>
        <TextBody>{t("jail.description")}</TextBody>
      </StyledContainer>
      <Backdrop open={loading || authLoading}>
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
      {jailInfo?.hasNotAddedLocation && (
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
}
