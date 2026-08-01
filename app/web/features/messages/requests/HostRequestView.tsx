import { ArchiveOutlined, UnarchiveOutlined } from "@mui/icons-material";
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
import { BackIcon, OverflowMenuIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import PageTitle from "components/PageTitle";
import { HostRequestStatus } from "couchers/proto/messages_pb";
import {
  GetHostRequestMessagesRes,
  RespondHostRequestReq,
} from "couchers/proto/requests_pb";
import { useAuthContext } from "features/auth/AuthProvider";
import { GROUP_CHAT_REFETCH_INTERVAL } from "features/messages/groupchats/constants";
import HostRequestSendField from "features/messages/requests/HostRequestSendField";
import useMarkLastSeen from "features/messages/useMarkLastSeen";
import {
  hostRequestKey,
  hostRequestMessagesKey,
  hostRequestsListKey,
  pingQueryKey,
} from "features/queryKeys";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { messagesRoute } from "routes";
import { service } from "service";
import { Temporal } from "temporal-polyfill";
import { theme } from "theme";
import { firstName } from "utils/names";
import { useIsNativeEmbed } from "utils/nativeLink";

import { requestStatusToTransKey } from "../constants";
import ChatContent from "../groupchats/ChatContent";
import HostRequestFeedbackCard from "./HostRequestFeedbackCard";
import HostRequestReferenceCard from "./HostRequestReferenceCard";
import HostRequestRespondButtons from "./HostRequestRespondButtons";
import HostRequestStatusBanner from "./HostRequestStatusBanner";
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
    // Use CSS custom property set by Navigation component for actual height
    height: isNativeEmbed
      ? "calc(100dvh - var(--nav-height, 3.5rem))"
      : "calc(100dvh - var(--nav-height, 3.5rem) - 56px - env(safe-area-inset-bottom, 0px))",

    [theme.breakpoints.up("md")]: {
      // On desktop, only subtract top nav (no bottom nav)
      height: "calc(100dvh - var(--nav-height, 4rem))",
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
  const { t } = useTranslation([MESSAGES]);
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
    refetchInterval: GROUP_CHAT_REFETCH_INTERVAL,
  });

  const { data: surfer } = useLiteUser(hostRequest?.surferUserId);
  const { data: host } = useLiteUser(hostRequest?.hostUserId);
  const currentUserId = useAuthContext().authState.userId;
  const isHost = hostRequest?.hostUserId === currentUserId;
  const otherUser = isHost ? surfer : host;
  const isRequestPast =
    hostRequest &&
    Temporal.PlainDate.compare(
      Temporal.PlainDate.from(hostRequest.toDate),
      Temporal.Now.plainDateISO(),
    ) < 0;

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
      queryClient.invalidateQueries({ queryKey: [pingQueryKey] });
    },
  });
  const { markLastSeen } = useMarkLastSeen(
    markLastRequestSeen,
    hostRequest?.lastSeenMessageId,
  );

  const archiveMutation = useMutation<void, RpcError>({
    mutationFn: async () => {
      await service.requests.setHostRequestArchiveStatus(
        hostRequestId,
        !hostRequest?.isArchived,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [hostRequestsListKey()] });
      queryClient.invalidateQueries({
        queryKey: hostRequestKey(hostRequestId),
      });
      router.push(messagesRoute);
    },
  });

  const handleBannerRespond = (status: HostRequestStatus) => () => {
    respondMutation.mutate({ hostRequestId, status, text: "" });
  };

  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuAnchor = useRef<HTMLButtonElement>(null);

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

        <HeaderButton
          onClick={() => setIsMenuOpen(true)}
          aria-label={t("show_more_actions_button_a11y")}
          aria-haspopup="true"
          aria-controls="request-menu"
          ref={menuAnchor}
          {...(isMobile ? { size: "small" } : {})}
        >
          <OverflowMenuIcon sx={{ fontSize: isMobile ? "small" : "medium" }} />
        </HeaderButton>
        <Menu
          id="request-menu"
          anchorEl={menuAnchor.current}
          keepMounted
          open={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        >
          {hostRequest && (
            <MenuItem
              onClick={() => {
                archiveMutation.mutate();
                setIsMenuOpen(false);
              }}
              disabled={archiveMutation.isPending}
            >
              {hostRequest.isArchived ? (
                <>
                  <UnarchiveOutlined fontSize="small" sx={{ mr: 1 }} />
                  {t("archive.unarchive_button")}
                </>
              ) : (
                <>
                  <ArchiveOutlined fontSize="small" sx={{ mr: 1 }} />
                  {t("archive.archive_button")}
                </>
              )}
            </MenuItem>
          )}
        </Menu>
      </StyledHeader>
      <HostRequestUserSummarySection
        hostRequest={hostRequest}
        otherUser={otherUser}
      />
      {hostRequest && !isRequestPast && (
        <HostRequestStatusBanner
          isHost={isHost}
          status={hostRequest.status}
          isLoading={respondMutation.isPending}
          onAccept={handleBannerRespond(
            HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED,
          )}
          onDecline={handleBannerRespond(
            HostRequestStatus.HOST_REQUEST_STATUS_REJECTED,
          )}
          onCancel={handleBannerRespond(
            HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED,
          )}
          hostName={otherUser ? firstName(otherUser.name) : undefined}
        />
      )}
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
        footer={
          hostRequest ? (
            <>
              {!isRequestPast && (
                <HostRequestRespondButtons
                  isHost={isHost}
                  status={hostRequest.status}
                  isLoading={respondMutation.isPending}
                  handleStatus={handleBannerRespond}
                  name={otherUser ? firstName(otherUser.name) : undefined}
                />
              )}
              {isHost && hostRequest.needHostRequestFeedback && (
                <HostRequestFeedbackCard hostRequestId={hostRequestId} />
              )}
              <HostRequestReferenceCard hostRequest={hostRequest} />
            </>
          ) : undefined
        }
      />
      <StyledFooter>
        {hostRequest && (
          <HostRequestSendField
            hostRequest={hostRequest}
            sendMutation={sendMutation}
          />
        )}
      </StyledFooter>
    </StyledPageWrapper>
  );
}
