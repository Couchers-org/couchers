import { Box, BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { unwrapResult } from "@reduxjs/toolkit";
import * as React from "react";
import { useEffect, useState } from "react";
import { useDispatch, useStore } from "react-redux";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { GroupChat } from "../../../pb/conversations_pb";
import { HostRequest } from "../../../pb/requests_pb";
import HostRequestList from "./HostRequestList";
import { fetchHostRequests } from "./hostRequestsActions";
import HostRequestView from "./HostRequestView";

const useStyles = makeStyles({ root: {} });

export interface GroupChatListProps extends BoxProps {
  groupChats: Array<GroupChat.AsObject>;
}

export default function SurfingTab() {
  const [hostRequest, setHostRequest] = useState<HostRequest.AsObject | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  useEffect(() => {
    setError("");
    (async () => {
      setLoading(true);
      try {
        const actionCreator = fetchHostRequests({});
        const action = await dispatch(actionCreator);
        await unwrapResult(action as any);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [dispatch]);
  const store = useStore();
  const hostRequests = store.getState().hostRequests.hostRequests;

  const classes = useStyles();
  return (
    <Box className={classes.root}>
      {hostRequest ? (
        <HostRequestView hostRequest={hostRequest} />
      ) : (
        <>
          {error && <Alert severity="error">{error}</Alert>}
          {loading ? (
            <CircularProgress />
          ) : (
            <HostRequestList
              hostRequests={hostRequests}
              setHostRequest={setHostRequest}
            />
          )}
        </>
      )}
    </Box>
  );
}
