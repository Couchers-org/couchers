import { Box } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import Divider from "components/Divider";
import HeaderButton from "components/HeaderButton";
import HostingStatus from "components/HostingStatus";
import { BackIcon, OverflowMenuIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import PageTitle from "components/PageTitle";
import UserSummary from "components/UserSummary";
import { useAuthContext } from "features/auth/AuthProvider";
import { useGroupChatViewStyles } from "features/messages/groupchats/GroupChatView";
import InfiniteMessageLoader from "features/messages/messagelist/InfiniteMessageLoader";
import MessageList from "features/messages/messagelist/MessageList";
import HostRequestSendField from "features/messages/surfing/HostRequestSendField";
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
} from "pb/requests_pb";
import { useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { service } from "service/index";
import { firstName } from "utils/names";

export default function HostRequestView() {
  const classes = useGroupChatViewStyles();

  const menuAnchor = useRef<HTMLAnchorElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = () => {
    setMenuOpen(true);
  };

  const handleClose = () => {
    setMenuOpen(false);
  };

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
    data: messagesRes,
    isLoading: isMessagesLoading,
    error: messagesError,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery<GetHostRequestMessagesRes.AsObject, GrpcError>(
    ["hostRequestMessages", hostRequestId],
    ({ pageParam: lastMessageId }) =>
      service.requests.getHostRequestMessages(hostRequestId, lastMessageId),
    {
      enabled: !!hostRequestId,
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastMessageId,
    }
  );

  const { data: surfer } = useUser(hostRequest?.fromUserId);
  const { data: host } = useUser(hostRequest?.toUserId);
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
        queryClient.invalidateQueries(["hostRequestMessages", hostRequestId]);
        queryClient.invalidateQueries(["hostRequests"]);
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
        queryClient.invalidateQueries([
          "hostRequest",
          hostRequest?.hostRequestId,
        ]);
        queryClient.invalidateQueries(["hostRequestMessages", hostRequestId]);
        queryClient.invalidateQueries(["hostRequests"]);
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
        queryClient.invalidateQueries(["hostRequest", hostRequestId]);
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
          {!title || hostRequestError ? <Skeleton width="100" /> : title}
        </PageTitle>

        <HeaderButton
          onClick={handleClick}
          aria-label="Menu"
          aria-haspopup="true"
          aria-controls="more-menu"
          innerRef={menuAnchor}
        >
          <OverflowMenuIcon />
        </HeaderButton>
        <Menu
          id="more-menu"
          anchorEl={menuAnchor.current}
          keepMounted
          open={menuOpen}
          onClose={handleClose}
        >
          <MenuItem onClick={() => null}>Placeholder</MenuItem>
        </Menu>
      </Box>

      <UserSummary user={otherUser}>
        <HostingStatus hostingStatus={otherUser?.hostingStatus} />
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
                className={classes.messageList}
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
