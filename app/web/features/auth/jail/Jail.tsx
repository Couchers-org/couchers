import { Backdrop } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
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
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  bottomMargin: { marginBottom: theme.spacing(4) },
  section: { marginBottom: theme.spacing(4) },
}));

export default function Jail() {
  const { t } = useTranslation(AUTH);
  const classes = useStyles(makeStyles);

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
      <TextBody className={classes.bottomMargin}>
        {t("jail.description")}
      </TextBody>
      <Backdrop open={loading || authLoading}>
        <CircularProgress />
      </Backdrop>
      {jailInfo?.hasNotAcceptedTos && (
        <TOSSection updateJailed={updateJailed} className={classes.section} />
      )}
      {jailInfo?.hasNotAcceptedCommunityGuidelines && (
        <CommunityGuidelinesSection
          updateJailed={updateJailed}
          className={classes.section}
        />
      )}
      {jailInfo?.hasNotAddedLocation && (
        <LocationSection
          updateJailed={updateJailed}
          className={classes.section}
        />
      )}
    </>
  );
}
