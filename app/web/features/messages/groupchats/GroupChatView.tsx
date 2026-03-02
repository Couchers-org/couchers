import { styled } from "@mui/material";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Alert from "components/Alert";
import HtmlMeta from "components/HtmlMeta";
import { useAuthContext } from "features/auth/AuthProvider";
import GroupChatSendField from "features/messages/groupchats/GroupChatSendField";
import useMarkLastSeen, {
  MarkLastSeenVariables,
} from "features/messages/useMarkLastSeen";
import { groupChatTitleText } from "features/messages/utils";
import {
  groupChatKey,
  groupChatMessagesKey,
  groupChatsListKey,
} from "features/queryKeys";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { GetGroupChatMessagesRes } from "proto/conversations_pb";
import { service } from "service";
import { useIsNativeEmbed } from "utils/nativeLink";

import ChatContent from "./ChatContent";
import { GROUP_CHAT_REFETCH_INTERVAL } from "./constants";
import GroupChatHeaderBar from "./GroupChatHeaderBar";

const StyledHeader = styled("div")(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
  "& > * + *": {
    marginInlineStart: theme.spacing(2),
  },

  [theme.breakpoints.down("md")]: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
}));

const StyledPageWrapper = styled("div")<{ isNativeEmbed: boolean }>(
  ({ theme, isNativeEmbed }) => ({
    display: "flex",
    flexDirection: "column",
    overflow: "hidden", // Prevent page scroll - only messages should scroll
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

const StyledCannotMessageText = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: "center",
}));

export default function GroupChatView({ chatId }: { chatId: number }) {
  const { t } = useTranslation([GLOBAL, MESSAGES]);
  const isNativeEmbed = useIsNativeEmbed();

  const queryClient = useQueryClient();

  const { data: groupChat, error: groupChatError } = useQuery({
    queryKey: groupChatKey(chatId),
    queryFn: () => service.conversations.getGroupChat(chatId),
    enabled: !!chatId,
    refetchInterval: GROUP_CHAT_REFETCH_INTERVAL,
  });

  //for title text
  const currentUserId = useAuthContext().authState.userId!;
  const groupChatMembersQuery = useLiteUsers(
    groupChat?.memberUserIdsList ?? [],
  );

  const {
    data: messagesRes,
    isLoading: isMessagesLoading,
    error: messagesError,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery<GetGroupChatMessagesRes.AsObject, RpcError>({
    queryKey: groupChatMessagesKey(chatId),
    queryFn: ({ pageParam }) =>
      service.conversations.getGroupChatMessages(
        chatId,
        pageParam as number | undefined,
      ),
    enabled: !!chatId,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.noMore ? undefined : lastPage.lastMessageId,
    refetchInterval: GROUP_CHAT_REFETCH_INTERVAL,
  });

  const sendMutation = useMutation<Empty, RpcError, string>({
    mutationFn: (text) => service.conversations.sendMessage(chatId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupChatMessagesKey(chatId) });
      queryClient.invalidateQueries({ queryKey: [groupChatsListKey] });
      queryClient.invalidateQueries({ queryKey: groupChatKey(chatId) });
    },
  });

  const { mutate: markLastSeenGroupChat } = useMutation<
    Empty,
    RpcError,
    MarkLastSeenVariables
  >({
    mutationFn: (messageId) =>
      service.conversations.markLastSeenGroupChat(chatId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupChatKey(chatId) });
    },
  });
  const { markLastSeen } = useMarkLastSeen(
    markLastSeenGroupChat,
    groupChat?.lastSeenMessageId,
  );

  const title = groupChat
    ? groupChatTitleText(groupChat, groupChatMembersQuery, currentUserId, t)
    : undefined;

  const hasError = groupChatError || messagesError || sendMutation.error;

  return (
    <>
      <HtmlMeta title={title} />
      {!chatId ? (
        <Alert severity="error">
          {t("messages:chat_view.invalid_id_error")}
        </Alert>
      ) : (
        <StyledPageWrapper isNativeEmbed={isNativeEmbed}>
          <StyledHeader>
            <GroupChatHeaderBar
              chatId={chatId}
              currentUserId={currentUserId}
              groupChat={groupChat}
              groupChatMembersQuery={groupChatMembersQuery}
              title={title}
            />
          </StyledHeader>
          {hasError && (
            <Alert severity="error">
              {groupChatError?.message ||
                messagesError?.message ||
                sendMutation.error?.message ||
                t("global:error.fallback.title")}
            </Alert>
          )}
          <ChatContent
            isHostRequest={false}
            isLoading={isMessagesLoading}
            messages={messagesRes}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={!!hasNextPage}
            markLastSeen={markLastSeen}
            isError={!!messagesError}
          />
          <StyledFooter>
            {groupChat?.canMessage ? (
              <GroupChatSendField
                sendMutation={sendMutation}
                chatId={chatId}
                currentUserId={currentUserId}
              />
            ) : (
              <StyledCannotMessageText>
                {t("messages:chat_view.cannot_message_text")}
              </StyledCannotMessageText>
            )}
          </StyledFooter>
        </StyledPageWrapper>
      )}
    </>
  );
}
