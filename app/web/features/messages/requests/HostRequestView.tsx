import { Typography, useMediaQuery } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import CircularProgress from "components/CircularProgress";
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
import {
  hostRequestKey,
  hostRequestMessagesKey,
  hostRequestsListKey,
} from "features/queryKeys";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { useRouter } from "next/router";
import {
  GetHostRequestMessagesRes,
  HostRequest,
  RespondHostRequestReq,
} from "proto/requests_pb";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { service } from "service";
import { theme } from "theme";
import { numNights } from "utils/date";
import dayjs from "utils/dayjs";
import makeStyles from "utils/makeStyles";
import { firstName } from "utils/names";

import { requestStatusToTransKey } from "../constants";

const useLocalStyles = makeStyles((theme) => ({
  avatar: {
    height: "2rem",
    width: "2rem",
  },
  largeUserSummary: {
    borderBottom: `1px solid ${theme.palette.divider}`,

    [theme.breakpoints.down("sm")]: {
      borderBottom: `1px solid ${theme.palette.divider}`,
      paddingBottom: theme.spacing(1),
    },

    [theme.breakpoints.up("sm")]: {
      padding: theme.spacing(1),
    },
  },
  smallUserSummary: {
    display: "flex",
    alignItems: "center",
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 2),
  },
  shortUserInfo: {
    display: "flex",
    flexDirection: "column",
    marginLeft: theme.spacing(2),
  },
}));

export default function HostRequestView({
  hostRequestId,
}: {
  hostRequestId: number;
}) {
  const { t } = useTranslation(MESSAGES);
  const classes = useGroupChatViewStyles();
  const localClasses = useLocalStyles();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: hostRequest, error: hostRequestError } = useQuery<
    HostRequest.AsObject,
    RpcError
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
  } = useInfiniteQuery<GetHostRequestMessagesRes.AsObject, RpcError>(
    hostRequestMessagesKey(hostRequestId),
    ({ pageParam: lastMessageId }) =>
      service.requests.getHostRequestMessages(hostRequestId, lastMessageId),
    {
      enabled: !!hostRequestId,
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastMessageId,
    }
  );

  const { data: surfer } = useLiteUser(hostRequest?.surferUserId);
  const { data: host } = useLiteUser(hostRequest?.hostUserId);
  const currentUserId = useAuthContext().authState.userId;
  const isHost = host?.userId === currentUserId;
  const otherUser = isHost ? surfer : host;
  const title =
    otherUser && hostRequest
      ? isHost
        ? t("host_request_view.title_for_host", {
            user: firstName(otherUser.name),
            status: t(requestStatusToTransKey[hostRequest.status]),
          })
        : t("host_request_view.title_for_surfer", {
            user: firstName(otherUser.name),
            status: t(requestStatusToTransKey[hostRequest.status]),
          })
      : undefined;

  const queryClient = useQueryClient();
  const sendMutation = useMutation<string | undefined, RpcError, string>(
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
    RpcError,
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
    RpcError,
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

  const router = useRouter();

  const handleBack = () => router.back();

  const largeUserSummarySection = (
    <div className={localClasses.largeUserSummary}>
      <UserSummary user={otherUser} smallAvatar={isMobile}>
        {hostRequest && (
          <div className={classes.requestedDatesWrapper}>
            <Typography
              component="p"
              variant="h3"
              className={classes.requestedDates}
            >
              {`${dayjs(hostRequest.fromDate).format("LL")} - ${dayjs(
                hostRequest.toDate
              ).format("LL")}`}
            </Typography>
            <Typography
              component="p"
              variant="h3"
              className={classes.numNights}
            >
              (
              {t("host_request_view.request_duration", {
                count: numNights(hostRequest.toDate, hostRequest.fromDate),
              })}
              )
            </Typography>
          </div>
        )}
      </UserSummary>
    </div>
  );

  const smallUserSummarySection = (
    <div className={localClasses.smallUserSummary}>
      {!otherUser ? (
        <Skeleton variant="circle" className={localClasses.avatar} />
      ) : (
        <Avatar
          className={localClasses.avatar}
          user={otherUser}
          isProfileLink
        />
      )}
      <div className={localClasses.shortUserInfo}>
        <Typography component="p" variant="body2">
          {!otherUser ? (
            <Skeleton />
          ) : (
            `${
              (otherUser?.name.length ?? 0) < 25
                ? otherUser?.name
                : otherUser?.name.substring(0, 25) + "..."
            }, ${otherUser?.age}, ${otherUser?.city.split(",")[2]}` // get only country
          )}
        </Typography>
        {hostRequest && (
          <Typography
            component="p"
            variant="h3"
            className={classes.requestedDates}
          >
            {`${dayjs(hostRequest.fromDate).format("ll")} - ${dayjs(
              hostRequest.fromDate
            ).format("ll")}`}
          </Typography>
        )}
      </div>
    </div>
  );

  return !hostRequestId ? (
    <Alert severity="error">{t("host_request_view.error_message")}</Alert>
  ) : (
    <div className={classes.pageWrapper}>
      <div className={classes.header}>
        <HeaderButton
          onClick={handleBack}
          aria-label={t("host_request_view.back_button_a11y_label")}
        >
          <BackIcon fontSize={isMobile ? "small" : "default"} />
        </HeaderButton>

        <PageTitle className={classes.title}>
          {!title || hostRequestError ? <Skeleton width="100" /> : title}
        </PageTitle>
      </div>
      {isMobile ? smallUserSummarySection : largeUserSummarySection}
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
            <Alert severity="error">{messagesError.message}</Alert>
          )}
          {messagesRes && hostRequest && (
            <>
              <InfiniteMessageLoader
                className={classes.messageLoader}
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
                {isMobile && (
                  <div className={classes.footer}>
                    <HostRequestSendField
                      hostRequest={hostRequest}
                      sendMutation={sendMutation}
                      respondMutation={respondMutation}
                    />
                  </div>
                )}
              </InfiniteMessageLoader>
              {/**
               * If it's mobile we don't want the send field to be sticky, rather show in scrollable area at the bottom
               */}
              {!isMobile && (
                <div className={classes.footer}>
                  <HostRequestSendField
                    hostRequest={hostRequest}
                    sendMutation={sendMutation}
                    respondMutation={respondMutation}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
