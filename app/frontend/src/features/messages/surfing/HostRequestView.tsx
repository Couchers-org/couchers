import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { Message } from "../../../pb/conversations_pb";
import { HostRequest } from "../../../pb/requests_pb";
import { service } from "../../../service";
import { useUser } from "../../userQueries/useUsers";
import MessageList from "../messagelist/MessageList";
import { Error as GrpcError } from "grpc-web";
import { useAuthContext } from "../../auth/AuthProvider";
import SendField from "../SendField";
import { useParams } from "react-router-dom";
import { firstName } from "../../../utils/names";

const useStyles = makeStyles({ root: {} });

export default function HostRequestView() {
  const classes = useStyles();

  const hostRequestId = +(
    useParams<{ hostRequestId?: string }>().hostRequestId || 0
  );

  const { data: hostRequest, error: hostRequestError } = useQuery<
    HostRequest.AsObject,
    GrpcError
  >(
    ["hostRequest", hostRequestId],
    () => service.requests.getHostRequest(hostRequestId),
    {
      enabled: !!hostRequestId,
    }
  );

  const {
    data: messages,
    isLoading: isMessagesLoading,
    error: messagesError,
  } = useQuery<Message.AsObject[], GrpcError>(
    ["hostRequestMessages", hostRequestId],
    () => service.requests.getHostRequestMessages(hostRequestId),
    { enabled: !!hostRequestId }
  );

  const { data: surfer } = useUser(hostRequest?.fromUserId);
  const { data: host } = useUser(hostRequest?.toUserId);
  const currentUserId = useAuthContext().authState.userId;
  const surferName = currentUserId === surfer?.userId ? "you" : surfer?.name;
  const hostName = currentUserId === host?.userId ? "you" : host?.name;
  const title =
    surferName && hostName
      ? `${firstName(surferName)} requested to be hosted by ${firstName(
          hostName
        )}`
      : undefined;

  const queryClient = useQueryClient();
  const mutation = useMutation<string | undefined, GrpcError, string>(
    (text: string) =>
      service.requests.sendHostRequestMessage(hostRequestId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["hostRequestMessages", hostRequestId]);
        queryClient.invalidateQueries(["hostRequests"]);
      },
    }
  );

  return !hostRequestId ? (
    <Alert severity={"error"}>Invalid host request id.</Alert>
  ) : (
    <Box className={classes.root}>
      <Typography variant="h3">
        {!title || hostRequestError ? <Skeleton width="100" /> : title}
      </Typography>
      {(mutation.error || hostRequestError) && (
        <Alert severity={"error"}>
          {mutation.error?.message || hostRequestError?.message}
        </Alert>
      )}
      {isMessagesLoading ? (
        <CircularProgress />
      ) : (
        <>
          {messagesError && (
            <Alert severity={"error"}>{messagesError.message}</Alert>
          )}
          {messages && (
            <>
              <MessageList messages={messages} />
              <SendField sendMutation={mutation} />
            </>
          )}
        </>
      )}
    </Box>
  );
}
