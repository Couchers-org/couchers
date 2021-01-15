import { Box, BoxProps, Typography } from "@material-ui/core";
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

const useStyles = makeStyles({ root: {} });

export interface HostRequestViewProps extends BoxProps {
  hostRequest: HostRequest.AsObject;
}

export default function HostRequestView({ hostRequest }: HostRequestViewProps) {
  const { data: messages, isLoading, error } = useQuery<
    Message.AsObject[],
    GrpcError
  >(["hostRequestMessages", hostRequest.hostRequestId], () =>
    service.requests.getHostRequestMessages(hostRequest.hostRequestId)
  );

  const { data: surfer, isLoading: surferLoading } = useUser(
    hostRequest.fromUserId
  );
  const { data: host, isLoading: hostLoading } = useUser(hostRequest.toUserId);
  const currentUserId = useAuthContext().authState.userId;
  const surferName = currentUserId === surfer?.userId ? "you" : surfer?.name;
  const hostName = currentUserId === host?.userId ? "you" : host?.name;
  const title = `${surferName} requested to be hosted by ${hostName}`;

  const queryClient = useQueryClient();
  const mutation = useMutation<string | undefined, GrpcError, string>(
    (text: string) =>
      service.requests.sendHostRequestMessage(hostRequest.hostRequestId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          "hostRequestMessages",
          hostRequest.hostRequestId,
        ]);
        queryClient.invalidateQueries(["hostRequests"]);
      },
    }
  );

  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Typography variant="h3">
        {surferLoading || hostLoading ? <Skeleton /> : title}
      </Typography>
      {mutation.error && <Alert severity={"error"}>{mutation.error}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          {error && <Alert severity={"error"}>{error.message}</Alert>}
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
