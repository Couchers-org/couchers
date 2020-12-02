import { Backdrop, makeStyles } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import PageTitle from "../../../components/PageTitle";
import TextBody from "../../../components/TextBody";
import { JailInfoRes } from "../../../pb/jail_pb";
import { getJailInfo } from "../../../service/jail";
import { useAppDispatch, useTypedSelector } from "../../../store";
import { updateJailStatus } from "./jailActions";
import TOSSection from "./TOSSection";

const useStyles = makeStyles((theme) => ({
  bottomMargin: { marginBottom: theme.spacing(4) },
}));

export default function Jail() {
  const classes = useStyles(makeStyles);

  const dispatch = useAppDispatch();
  const isJailed = useTypedSelector((state) => state.auth.jailed);
  const authError = useTypedSelector((state) => state.auth.error);
  const authLoading = useTypedSelector((state) => state.auth.loading);

  const [loading, setLoading] = useState(false);
  const [jailInfo, setJailInfo] = useState<null | JailInfoRes.AsObject>(null);

  useEffect(() => {
    (async () => {
      //just in case the store is stale
      dispatch(updateJailStatus());
      setLoading(true);
      setJailInfo(await getJailInfo());
      setLoading(false);
    })();
  }, [dispatch]);

  const updateJailed = () => {
    dispatch(updateJailStatus());
  };

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
        <TOSSection updateJailed={updateJailed} />
      )}
    </>
  );
}
