import { Skeleton, styled, useMediaQuery } from "@mui/material";
import Alert from "components/Alert";
import HeaderButton from "components/HeaderButton";
import { BackIcon } from "components/Icons";
import PageTitle from "components/PageTitle";
import { useAuthContext } from "features/auth/AuthProvider";
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
import { firstName } from "utils/names";

import { requestStatusToTransKey } from "../constants";
import ChatContent from "../groupchats/ChatContent";
import HostRequestUserSummarySection from "./HostRequestUserSummarySection";

const StyledHeader = styled("div")(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  alignItems: "center",
  display: "flex",
  flexGrow: 0,
  "& > * + *": {
    marginInlineStart: theme.spacing(2),
  },

  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0, 1.5),
  },
}));

const StyledPageTitle = styled(PageTitle)({
  flexGrow: 1,
  width: "100%",
  display: "flex",
  alignItems: "center",
  marginInlineEnd: theme.spacing(2),
  marginInlineStart: theme.spacing(2),
  "& > *": { marginInlineEnd: theme.spacing(2) },

  [theme.breakpoints.down("sm")]: {
    fontSize: "0.9rem",
  },
});

const StyledPageWrapper = styled("div")(({ theme }) => ({
  alignItems: "stretch",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  height: `calc(var(--vh, 1vh) * 100 - ${theme.shape.navPaddingXs})`,

  [theme.breakpoints.up("sm")]: {
    height: `calc(var(--vh, 1vh) * 100 - ${theme.shape.navPaddingSmUp})`,
  },
}));

const StyledFooter = styled("div")(({ theme }) => ({
  background: theme.palette.common.white,
  position: "sticky",
  bottom: 0,
  marginTop: "auto",
  flexGrow: 0,
  paddingBottom: theme.spacing(2),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),

  [theme.breakpoints.down("md")]: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
}));

export default function HostRequestView({
  hostRequestId,
}: {
  hostRequestId: number;
}) {
  const { t } = useTranslation(MESSAGES);

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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

  const hasError =
    respondMutation.error || sendMutation.error || hostRequestError;

  if (!hostRequestId) {
    return (
      <Alert severity="error">{t("host_request_view.error_message")}</Alert>
    );
  }

  return (
    <StyledPageWrapper>
      <StyledHeader>
        <HeaderButton
          onClick={handleBack}
          aria-label={t("host_request_view.back_button_a11y_label")}
          {...(isMobile ? { size: "small" } : {})}
        >
          <BackIcon sx={{ fontSize: isMobile ? "small" : "medium" }} />
        </HeaderButton>

        <StyledPageTitle>
          {!title || hostRequestError ? <Skeleton width="100" /> : title}
        </StyledPageTitle>
      </StyledHeader>
      <HostRequestUserSummarySection
        hostRequest={hostRequest}
        otherUser={otherUser}
      />
      {hasError && (
        <Alert severity={"error"}>
          {respondMutation.error?.message ||
            sendMutation.error?.message ||
            hostRequestError?.message ||
            ""}
        </Alert>
      )}
      {messagesError && <Alert severity="error">{messagesError.message}</Alert>}
      <ChatContent
        isHostRequest
        isLoading={isMessagesLoading}
        messages={messagesRes}
        hostRequest={hostRequest}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={!!hasNextPage}
        markLastSeen={markLastSeen}
        isError={!!messagesError}
      />
      <StyledFooter>
        {hostRequest && (
          <HostRequestSendField
            hostRequest={hostRequest}
            sendMutation={sendMutation}
            respondMutation={respondMutation}
          />
        )}
      </StyledFooter>
    </StyledPageWrapper>
  );
}
