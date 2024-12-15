import { styled } from "@mui/material";
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
import { GetGroupChatMessagesRes, GroupChat } from "proto/conversations_pb";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { service } from "service";

import ChatContent from "./ChatContent";
import { GROUP_CHAT_REFETCH_INTERVAL } from "./constants";
import GroupChatHeaderBar from "./GroupChatHeaderBar";

const StyledHeader = styled("div")(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  alignItems: "center",
  display: "flex",
  flexGrow: 0,
  "& > * + *": {
    marginInlineStart: theme.spacing(2),
  },

  [theme.breakpoints.down("md")]: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
}));

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

export default function GroupChatView({ chatId }: { chatId: number }) {
  const { t } = useTranslation([GLOBAL, MESSAGES]);

  const queryClient = useQueryClient();

  const { data: groupChat, error: groupChatError } = useQuery<
    GroupChat.AsObject,
    RpcError
  >(groupChatKey(chatId), () => service.conversations.getGroupChat(chatId), {
    enabled: !!chatId,
    refetchInterval: GROUP_CHAT_REFETCH_INTERVAL,
  });

  //for title text
  const currentUserId = useAuthContext().authState.userId!;
  const groupChatMembersQuery = useLiteUsers(
    groupChat?.memberUserIdsList ?? []
  );

  const {
    data: messagesRes,
    isLoading: isMessagesLoading,
    error: messagesError,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery<GetGroupChatMessagesRes.AsObject, RpcError>(
    groupChatMessagesKey(chatId),
    ({ pageParam: lastMessageId }) =>
      service.conversations.getGroupChatMessages(chatId, lastMessageId),
    {
      enabled: !!chatId,
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastMessageId,
      refetchInterval: GROUP_CHAT_REFETCH_INTERVAL,
    }
  );

  const sendMutation = useMutation<Empty, RpcError, string>(
    (text) => service.conversations.sendMessage(chatId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(groupChatMessagesKey(chatId));
        queryClient.invalidateQueries([groupChatsListKey]);
        queryClient.invalidateQueries(groupChatKey(chatId));
      },
    }
  );

  const { mutate: markLastSeenGroupChat } = useMutation<
    Empty,
    RpcError,
    MarkLastSeenVariables
  >(
    (messageId) =>
      service.conversations.markLastSeenGroupChat(chatId, messageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(groupChatKey(chatId));
      },
    }
  );
  const { markLastSeen } = useMarkLastSeen(
    markLastSeenGroupChat,
    groupChat?.lastSeenMessageId
  );

  const title = groupChat
    ? groupChatTitleText(groupChat, groupChatMembersQuery, currentUserId)
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
        <StyledPageWrapper>
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
            <GroupChatSendField
              sendMutation={sendMutation}
              chatId={chatId}
              currentUserId={currentUserId}
            />
          </StyledFooter>
        </StyledPageWrapper>
      )}
    </>
  );
}
