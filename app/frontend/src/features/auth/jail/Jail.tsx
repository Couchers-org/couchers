import { Backdrop, makeStyles } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import { loginRoute } from "../../../AppRoutes";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import PageTitle from "../../../components/PageTitle";
import TextBody from "../../../components/TextBody";
import { JailInfoRes } from "../../../pb/jail_pb";
import { service } from "../../../service";
import { AuthContext, useAppContext } from "../AuthProvider";
import LocationSection from "./LocationSection";
import TOSSection from "./TOSSection";

const useStyles = makeStyles((theme) => ({
  bottomMargin: { marginBottom: theme.spacing(4) },
  section: { marginBottom: theme.spacing(4) },
}));

export default function Jail() {
  const classes = useStyles(makeStyles);

  const authContext = useAppContext(AuthContext);
  const isJailed = authContext.jailed;
  const authError = authContext.error;
  const authLoading = authContext.loading;
  const isAuthenticated = authContext.authenticated;

  const [loading, setLoading] = useState(false);
  const [jailInfo, setJailInfo] = useState<null | JailInfoRes.AsObject>(null);

  ///TODO: This could fire twice because of authContext dependency
  useEffect(() => {
    (async () => {
      //just in case the store is stale
      authContext.updateJailStatus();
      setLoading(true);
      setJailInfo(await service.jail.getJailInfo());
      setLoading(false);
    })();
  }, [authContext]);

  const updateJailed = () => {
    authContext.updateJailStatus();
  };

  if (!isAuthenticated) return <Redirect to={loginRoute} />;

  return (
    <>
      {!isJailed && <Redirect to="/" />}
      <PageTitle>More information required</PageTitle>
      {authError && <Alert severity="error">{authError}</Alert>}
      <TextBody className={classes.bottomMargin}>
        Please check the following in order to continue.
      </TextBody>
      <Backdrop open={loading || authLoading}>
        <CircularProgress />
      </Backdrop>
      {jailInfo?.hasNotAcceptedTos && (
        <TOSSection updateJailed={updateJailed} className={classes.section} />
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
