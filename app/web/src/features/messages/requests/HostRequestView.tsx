import { Box, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import Divider from "components/Divider";
import HeaderButton from "components/HeaderButton";
import { BackIcon } from "components/Icons";
import PageTitle from "components/PageTitle";
import UserSummary from "components/UserSummary";
import { useAuthContext } from "features/auth/AuthProvider";
import { useGroupChatViewStyles } from "features/messages/groupchats/GroupChatView";
import InfiniteMessageLoader from "features/messages/messagelist/InfiniteMessageLoader";
import MessageList from "features/messages/messagelist/MessageList";
import HostRequestSendField from "features/messages/requests/HostRequestSendField";
import useMarkLastSeen, {
  MarkLastSeenVariables,
} from "features/messages/useMarkLastSeen";
import { useUser } from "features/userQueries/useUsers";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import {
  GetHostRequestMessagesRes,
  HostRequest,
  RespondHostRequestReq,
} from "proto/requests_pb";
import {
  hostRequestKey,
  hostRequestMessagesKey,
  hostRequestsListKey,
} from "queryKeys";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { service } from "service";
import { formatDate, numNights } from "utils/date";
import { firstName } from "utils/names";

import { hostRequestStatusLabels } from "../constants";

export default function HostRequestView() {
  const classes = useGroupChatViewStyles();

  const hostRequestId = +(
    useParams<{ hostRequestId?: string }>().hostRequestId || 0
  );

  const { data: hostRequest, error: hostRequestError } = useQuery<
    HostRequest.AsObject,
    GrpcError
  >(
    hostRequestKey(hostRequestId),
    () => service.requests.getHostRequest(hostRequestId),
    {
      enabled: !!hostRequestId,
    }
  );

  const {
    data: messagesRes,
    isLoading: isMessagesLoading,
    error: messagesError,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery<GetHostRequestMessagesRes.AsObject, GrpcError>(
    hostRequestMessagesKey(hostRequestId),
    ({ pageParam: lastMessageId }) =>
      service.requests.getHostRequestMessages(hostRequestId, lastMessageId),
    {
      enabled: !!hostRequestId,
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastMessageId,
    }
  );

  const { data: surfer } = useUser(hostRequest?.surferUserId);
  const { data: host } = useUser(hostRequest?.hostUserId);
  const currentUserId = useAuthContext().authState.userId;
  const isHost = host?.userId === currentUserId;
  const otherUser = isHost ? surfer : host;
  const title = otherUser
    ? isHost
      ? `Request from ${firstName(otherUser.name)}`
      : `Request to ${firstName(otherUser.name)}`
    : undefined;

  const queryClient = useQueryClient();
  const sendMutation = useMutation<string | undefined, GrpcError, string>(
    (text: string) =>
      service.requests.sendHostRequestMessage(hostRequestId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(hostRequestMessagesKey(hostRequestId));
        queryClient.invalidateQueries(hostRequestsListKey());
      },
    }
  );
  const respondMutation = useMutation<
    void,
    GrpcError,
    Required<RespondHostRequestReq.AsObject>
  >(
    (req) =>
      service.requests.respondHostRequest(
        req.hostRequestId,
        req.status,
        req.text
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(
          hostRequestKey(hostRequest?.hostRequestId)
        );
        queryClient.invalidateQueries(hostRequestMessagesKey(hostRequestId));
        queryClient.invalidateQueries(hostRequestsListKey());
      },
    }
  );

  const { mutate: markLastRequestSeen } = useMutation<
    Empty,
    GrpcError,
    MarkLastSeenVariables
  >(
    (messageId) =>
      service.requests.markLastRequestSeen(hostRequestId, messageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(hostRequestKey(hostRequestId));
      },
    }
  );
  const { markLastSeen } = useMarkLastSeen(
    markLastRequestSeen,
    hostRequest?.lastSeenMessageId
  );

  const history = useHistory();

  const handleBack = () => history.goBack();

  return !hostRequestId ? (
    <Alert severity={"error"}>Invalid host request id.</Alert>
  ) : (
    <Box className={classes.pageWrapper}>
      <Box className={classes.header}>
        <HeaderButton onClick={handleBack} aria-label="Back">
          <BackIcon />
        </HeaderButton>

        <PageTitle className={classes.title}>
          {!title || hostRequestError ? (
            <Skeleton width="100" />
          ) : (
            `${title} - ${
              hostRequest && hostRequestStatusLabels[hostRequest.status]
            }`
          )}
        </PageTitle>
      </Box>
      <UserSummary user={otherUser}>
        {hostRequest && (
          <div className={classes.requestedDatesWrapper}>
            <Typography
              component="p"
              variant="h3"
              className={classes.requestedDates}
            >
              {`${formatDate(hostRequest.fromDate, true)} -
              ${formatDate(hostRequest?.toDate, true)}`}
            </Typography>
            <Typography
              component="p"
              variant="h3"
              className={classes.numNights}
            >
              ({numNights(hostRequest.toDate, hostRequest.fromDate)})
            </Typography>
          </div>
        )}
      </UserSummary>
      <Divider />
      {(respondMutation.error || sendMutation.error || hostRequestError) && (
        <Alert severity={"error"}>
          {respondMutation.error?.message ||
            sendMutation.error?.message ||
            hostRequestError?.message ||
            ""}
        </Alert>
      )}
      {isMessagesLoading ? (
        <CircularProgress />
      ) : (
        <>
          {messagesError && (
            <Alert severity={"error"}>{messagesError.message}</Alert>
          )}
          {messagesRes && hostRequest && (
            <>
              <InfiniteMessageLoader
                earliestMessageId={
                  messagesRes.pages[messagesRes.pages.length - 1].lastMessageId
                }
                fetchNextPage={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={!!hasNextPage}
                isError={!!messagesError}
              >
                <MessageList
                  markLastSeen={markLastSeen}
                  messages={messagesRes.pages
                    .map((page) => page.messagesList)
                    .flat()}
                />
              </InfiniteMessageLoader>
              <Box className={classes.footer}>
                <HostRequestSendField
                  hostRequest={hostRequest}
                  sendMutation={sendMutation}
                  respondMutation={respondMutation}
                />
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
}
