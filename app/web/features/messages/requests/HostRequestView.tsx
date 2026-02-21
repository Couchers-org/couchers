import { Skeleton, styled, useMediaQuery } from "@mui/material";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Alert from "components/Alert";
import HeaderButton from "components/HeaderButton";
import { BackIcon } from "components/Icons";
import PageTitle from "components/PageTitle";
import dayjs from "dayjs";
import { useAuthContext } from "features/auth/AuthProvider";
import HostRequestSendField from "features/messages/requests/HostRequestSendField";
import useMarkLastSeen from "features/messages/useMarkLastSeen";
import {
  hostRequestKey,
  hostRequestMessagesKey,
  hostRequestsListKey,
} from "features/queryKeys";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { useRouter } from "next/router";
import {
  GetHostRequestMessagesRes,
  RespondHostRequestReq,
} from "proto/requests_pb";
import { messagesRoute } from "routes";
import { service } from "service";
import { theme } from "theme";
import { firstName } from "utils/names";
import { useIsNativeEmbed } from "utils/nativeLink";

import { requestStatusToTransKey } from "../constants";
import ChatContent from "../groupchats/ChatContent";
import HostRequestUserSummarySection from "./HostRequestUserSummarySection";

const StyledHeader = styled("div")(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
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

const StyledPageWrapper = styled("div")<{ isNativeEmbed: boolean }>(
  ({ theme, isNativeEmbed }) => ({
    display: "flex",
    flexDirection: "column",
    // Use dvh (dynamic viewport height) which adjusts for mobile keyboard
    // On mobile web (not native app), subtract both top nav and bottom nav (56px)
    height: isNativeEmbed
      ? `calc(100dvh - ${theme.shape.navPaddingXs})`
      : `calc(100dvh - ${theme.shape.navPaddingXs} - 56px)`,

    [theme.breakpoints.up("md")]: {
      // On desktop, only subtract top nav (no bottom nav)
      height: `calc(100dvh - ${theme.shape.navPaddingSmUp})`,
    },
  }),
);

// Footer is fixed at bottom - never scrolls away
const StyledFooter = styled("div")(({ theme }) => ({
  background: "var(--mui-palette-background-default)",
  flexShrink: 0,
  paddingBottom: theme.spacing(2),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),

  [theme.breakpoints.down("md")]: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    paddingBottom: `calc(${theme.spacing(2)} + env(safe-area-inset-bottom, 0px))`,
  },
}));

export default function HostRequestView({
  hostRequestId,
}: {
  hostRequestId: number;
}) {
  const { t } = useTranslation(MESSAGES);
  const isNativeEmbed = useIsNativeEmbed();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { data: hostRequest, error: hostRequestError } = useQuery({
    queryKey: hostRequestKey(hostRequestId),
    queryFn: () => service.requests.getHostRequest(hostRequestId),
    enabled: !!hostRequestId,
  });

  const {
    data: messagesRes,
    isLoading: isMessagesLoading,
    error: messagesError,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery<
    GetHostRequestMessagesRes.AsObject,
    RpcError,
    InfiniteData<GetHostRequestMessagesRes.AsObject>,
    (string | number | undefined)[],
    number
  >({
    queryKey: hostRequestMessagesKey(hostRequestId),
    queryFn: ({ pageParam: lastMessageId }) =>
      service.requests.getHostRequestMessages(hostRequestId, lastMessageId),
    enabled: !!hostRequestId,
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.noMore ? undefined : lastPage.lastMessageId,
  });

  const { data: surfer } = useLiteUser(hostRequest?.surferUserId);
  const { data: host } = useLiteUser(hostRequest?.hostUserId);
  const currentUserId = useAuthContext().authState.userId;
  const isHost = host?.userId === currentUserId;
  const otherUser = isHost ? surfer : host;
  const isRequestPast = dayjs(hostRequest?.toDate).isBefore(
    dayjs().format("L"),
  );

  let title =
    otherUser && hostRequest
      ? isHost
        ? t("host_request_view.title_for_host", {
            user: firstName(otherUser.name),
            status: t(
              requestStatusToTransKey[
                hostRequest.status as keyof typeof requestStatusToTransKey
              ],
            ),
          })
        : t("host_request_view.title_for_surfer", {
            user: firstName(otherUser.name),
            status: t(
              requestStatusToTransKey[
                hostRequest.status as keyof typeof requestStatusToTransKey
              ],
            ),
          })
      : undefined;

  if (isRequestPast) {
    title = title + ` (${t("host_request_status.past")})`;
  }

  const queryClient = useQueryClient();
  const sendMutation = useMutation<string | undefined, RpcError, string>({
    mutationFn: (text: string) =>
      service.requests.sendHostRequestMessage(hostRequestId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: hostRequestMessagesKey(hostRequestId),
      });
      queryClient.invalidateQueries({ queryKey: hostRequestsListKey() });
    },
  });
  const respondMutation = useMutation<
    void,
    RpcError,
    Required<RespondHostRequestReq.AsObject>
  >({
    mutationFn: (req) =>
      service.requests.respondHostRequest(
        req.hostRequestId,
        req.status,
        req.text,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: hostRequestKey(hostRequest?.hostRequestId),
      });
      queryClient.invalidateQueries({
        queryKey: hostRequestMessagesKey(hostRequestId),
      });
      queryClient.invalidateQueries({ queryKey: hostRequestsListKey() });
    },
  });

  const { mutate: markLastRequestSeen } = useMutation({
    mutationFn: (messageId: number) =>
      service.requests.markLastRequestSeen(hostRequestId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: hostRequestKey(hostRequestId),
      });
    },
  });
  const { markLastSeen } = useMarkLastSeen(
    markLastRequestSeen,
    hostRequest?.lastSeenMessageId,
  );

  const router = useRouter();

  const handleBack = () => router.push(messagesRoute);

  const hasError =
    respondMutation.error || sendMutation.error || hostRequestError;

  if (!hostRequestId) {
    return (
      <Alert severity="error">{t("host_request_view.error_message")}</Alert>
    );
  }

  return (
    <StyledPageWrapper isNativeEmbed={isNativeEmbed}>
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
