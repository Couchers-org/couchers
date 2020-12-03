import { Box, BoxProps, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "react-redux";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { Message } from "../../../pb/conversations_pb";
import { HostRequest } from "../../../pb/requests_pb";
import { service } from "../../../service";
import { fetchUsers, getUser } from "../../userCache";
import MessageList from "../messagelist/MessageList";

const useStyles = makeStyles({ root: {} });

export interface HostRequestViewProps extends BoxProps {
  hostRequest: HostRequest.AsObject;
}

export default function HostRequestView({ hostRequest }: HostRequestViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message.AsObject[]>([]);
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const messages = await service.requests.getHostRequestMessages(
        hostRequest.hostRequestId
      );
      setMessages(messages);
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  }, [hostRequest.hostRequestId]);

  useEffect(() => {
    dispatch(fetchUsers({ userIds: [hostRequest.fromUserId, hostRequest.toUserId] }));
  }, [hostRequest.fromUserId, hostRequest.toUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async (text: string) => {
    await service.requests.sendHostRequestMessage(
      hostRequest.hostRequestId,
      text
    );
    await fetchMessages();
  };

  const store = useStore();
  const surfer = getUser(store.getState(), hostRequest.fromUserId);
  const host = getUser(store.getState(), hostRequest.toUserId);
  const currentUser = store.getState().auth.user;
  const surferName =
    currentUser?.userId === surfer?.userId ? "you" : surfer?.name;
  const hostName = currentUser?.userId === host?.userId ? "you" : host?.name;
  const title = `${surferName} requested to be hosted by ${hostName}`;

  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Typography variant="h3">{title}</Typography>
      {error && <Alert severity={"error"}>{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        <MessageList messages={messages} handleSend={handleSend} />
      )}
    </Box>
  );
}
