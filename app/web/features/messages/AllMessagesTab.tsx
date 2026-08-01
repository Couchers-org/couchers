import { Chip, List, styled } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import NotificationBadge from "components/NotificationBadge";
import TextBody from "components/TextBody";
import { GroupChat, ListGroupChatsRes } from "couchers/proto/conversations_pb";
import { HostRequest, ListHostRequestsRes } from "couchers/proto/requests_pb";
import CreateGroupChat from "features/messages/groupchats/CreateGroupChat";
import GroupChatListItem from "features/messages/groupchats/GroupChatListItem";
import HostRequestListItem from "features/messages/requests/HostRequestListItem";
import useMessageListsAutoRefetch from "features/messages/useMessageListsAutoRefetch";
import { hasUnreadMessages } from "features/messages/utils";
import { groupChatsListKey, hostRequestsListKey } from "features/queryKeys";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import { routeToGroupChat, routeToHostRequest } from "routes";
import { service } from "service";
import { theme } from "theme";

import useNotifications from "../useNotifications";

const StyledWrapper = styled("div")(() => ({
  padding: theme.spacing(0, 2),
}));

const StyledList = styled(List)(() => ({
  width: "100%",
}));

const StyledCreateGroupChatButton = styled(CreateGroupChat)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  marginInline: `-${theme.spacing(2)}`,
  "& .MuiListItemButton-root": {
    padding: theme.spacing(0.75),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    border: "1px dashed var(--mui-palette-grey-400)",
    backgroundColor: "var(--mui-palette-background-paper)",
    [theme.breakpoints.up("md")]: {
      padding: theme.spacing(1),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
    "&:hover": {
      backgroundColor: "var(--mui-palette-grey-100)",
      borderColor: "var(--mui-palette-grey-600)",
    },
  },
  "& .MuiListItemAvatar-root": {
    minWidth: 40,
    marginLeft: 0,
    [theme.breakpoints.up("md")]: {
      minWidth: 56,
    },
  },
}));

const StyledGroupChatListItem = styled(GroupChatListItem)(() => ({
  marginInline: `-${theme.spacing(2)}`,
  paddingInline: `${theme.spacing(2)}`,
}));

const StyledHostRequestListItem = styled(HostRequestListItem)(() => ({
  marginInline: `-${theme.spacing(2)}`,
  paddingInline: `${theme.spacing(2)}`,
}));

const StyledFilterContainer = styled("div")(() => ({
  display: "flex",
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  flexWrap: "wrap",
}));

type FilterType =
  | "all"
  | "unread"
  | "chats"
  | "hosting"
  | "surfing"
  | "archived";

interface MessageItem {
  type: "chat" | "host-request";
  id: number;
  lastMessageTime: number; // timestamp in seconds
  data: GroupChat.AsObject | HostRequest.AsObject;
  isArchived: boolean;
}

export default function AllMessagesTab() {
  const { t } = useTranslation(MESSAGES);
  const router = useRouter();
  const { data: notifications } = useNotifications();
  const { data: currentUser } = useCurrentUser();
  const unseenMessageCount = notifications?.unseenMessageCount;
  const unseenReceivedHostRequestCount =
    notifications?.unseenReceivedHostRequestCount;
  const unseenSentHostRequestCount = notifications?.unseenSentHostRequestCount;

  useMessageListsAutoRefetch();

  // Get filter from URL path, default to "all"
  const slugs =
    typeof router.query.slug === "undefined"
      ? ["all"]
      : typeof router.query.slug === "string"
        ? [router.query.slug]
        : router.query.slug;

  const filterFromPath = slugs[0] as FilterType;
  const filter = [
    "all",
    "unread",
    "chats",
    "hosting",
    "surfing",
    "archived",
  ].includes(filterFromPath)
    ? filterFromPath
    : "all";

  const showArchived = filter === "archived";
  const requestType =
    filter === "hosting" ? "hosting" : filter === "surfing" ? "surfing" : "all";

  // Navigate to the appropriate route when filter changes
  const handleFilterChange = (newFilter: FilterType) => {
    router.push(`/messages/${newFilter}`);
  };

  const shouldFetchChats = filter !== "hosting" && filter !== "surfing";
  const shouldFetchRequests = filter !== "chats";

  // Fetch group chats
  const {
    data: chatsData,
    isLoading: chatsLoading,
    error: chatsError,
    hasNextPage: chatsHasNextPage,
    fetchNextPage: chatsFetchNextPage,
    isFetchingNextPage: chatsIsFetchingNextPage,
  } = useInfiniteQuery<ListGroupChatsRes.AsObject, RpcError>({
    queryKey: groupChatsListKey({ onlyArchived: showArchived }),
    queryFn: ({ pageParam: lastMessageId }) =>
      service.conversations.listGroupChats(
        lastMessageId as number | undefined,
        50,
        showArchived,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.noMore || !lastPage.lastMessageId
        ? undefined
        : lastPage.lastMessageId,
    initialPageParam: undefined,
    enabled: shouldFetchChats,
  });

  // Fetch host requests
  const {
    data: requestsData,
    isLoading: requestsLoading,
    error: requestsError,
    hasNextPage: requestsHasNextPage,
    fetchNextPage: requestsFetchNextPage,
    isFetchingNextPage: requestsIsFetchingNextPage,
  } = useInfiniteQuery<ListHostRequestsRes.AsObject, RpcError>({
    queryKey: hostRequestsListKey({
      onlyArchived: showArchived,
      type: requestType,
    }),
    queryFn: ({ pageParam: pageToken }) =>
      service.requests.listHostRequests({
        pageToken: pageToken as string | undefined,
        onlyArchived: showArchived,
        type: requestType,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.noMore || !lastPage.nextPageToken
        ? undefined
        : lastPage.nextPageToken,
    initialPageParam: undefined,
    enabled: shouldFetchRequests,
  });

  const isLoading = chatsLoading || requestsLoading;
  const error = chatsError || requestsError;

  // Combine and sort all messages by last message time
  const allMessages = useMemo(() => {
    const messages: MessageItem[] = [];

    // Add chats
    if (chatsData) {
      chatsData.pages.forEach((page) => {
        page.groupChatsList.forEach((chat) => {
          messages.push({
            type: "chat",
            id: chat.groupChatId,
            lastMessageTime: chat.latestMessage?.time?.seconds ?? 0,
            data: chat,
            isArchived: showArchived,
          });
        });
      });
    }

    // Add host requests
    if (requestsData) {
      requestsData.pages.forEach((page) => {
        page.hostRequestsList.forEach((request) => {
          messages.push({
            type: "host-request",
            id: request.hostRequestId,
            lastMessageTime: request.latestMessage?.time?.seconds ?? 0,
            data: request,
            isArchived: showArchived,
          });
        });
      });
    }

    // Sort by last message time (newest first)
    return messages.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  }, [chatsData, requestsData, showArchived]);

  // Filter messages based on selected filter
  const filteredMessages = useMemo(() => {
    if (filter === "all" || filter === "archived") {
      return allMessages;
    }
    if (filter === "unread") {
      return allMessages.filter((msg) => hasUnreadMessages(msg.data));
    }
    if (filter === "chats") {
      return allMessages.filter((msg) => msg.type === "chat");
    }
    if (filter === "hosting") {
      return allMessages.filter(
        (msg) =>
          msg.type === "host-request" &&
          (msg.data as HostRequest.AsObject).hostUserId === currentUser?.userId,
      );
    }
    if (filter === "surfing") {
      return allMessages.filter(
        (msg) =>
          msg.type === "host-request" &&
          (msg.data as HostRequest.AsObject).surferUserId ===
            currentUser?.userId,
      );
    }
    return allMessages;
  }, [allMessages, filter, currentUser?.userId]);

  const hasMoreMessages =
    (shouldFetchChats && chatsHasNextPage) ||
    (shouldFetchRequests && requestsHasNextPage);
  const isFetchingMore =
    (shouldFetchChats && chatsIsFetchingNextPage) ||
    (shouldFetchRequests && requestsIsFetchingNextPage);

  const loadMoreMessages = async () => {
    const promises = [];
    if (shouldFetchChats && chatsHasNextPage)
      promises.push(chatsFetchNextPage());
    if (shouldFetchRequests && requestsHasNextPage)
      promises.push(requestsFetchNextPage());
    await Promise.all(promises);
  };

  // Calculate unread counts for each filter
  const unseenChatsCount = unseenMessageCount ?? 0;
  const unseenHostingCount = unseenReceivedHostRequestCount ?? 0;
  const unseenSurfingCount = unseenSentHostRequestCount ?? 0;
  const unseenAllCount =
    unseenChatsCount + unseenHostingCount + unseenSurfingCount;

  return (
    <StyledWrapper>
      {!showArchived && <StyledCreateGroupChatButton />}
      <StyledFilterContainer>
        <NotificationBadge>
          <Chip
            label={t("all_messages_tab.filter.all")}
            onClick={() => handleFilterChange("all")}
            color={filter === "all" ? "primary" : "default"}
            variant={filter === "all" ? "filled" : "outlined"}
          />
        </NotificationBadge>
        <NotificationBadge count={unseenAllCount}>
          <Chip
            label={t("messages_page.tabs.unread")}
            onClick={() => handleFilterChange("unread")}
            color={filter === "unread" ? "primary" : "default"}
            variant={filter === "unread" ? "filled" : "outlined"}
          />
        </NotificationBadge>
        <NotificationBadge count={unseenChatsCount}>
          <Chip
            label={t("messages_page.tabs.chats")}
            onClick={() => handleFilterChange("chats")}
            color={filter === "chats" ? "primary" : "default"}
            variant={filter === "chats" ? "filled" : "outlined"}
          />
        </NotificationBadge>
        <NotificationBadge count={unseenHostingCount}>
          <Chip
            label={t("messages_page.tabs.hosting")}
            onClick={() => handleFilterChange("hosting")}
            color={filter === "hosting" ? "primary" : "default"}
            variant={filter === "hosting" ? "filled" : "outlined"}
          />
        </NotificationBadge>
        <NotificationBadge count={unseenSurfingCount}>
          <Chip
            label={t("messages_page.tabs.surfing")}
            onClick={() => handleFilterChange("surfing")}
            color={filter === "surfing" ? "primary" : "default"}
            variant={filter === "surfing" ? "filled" : "outlined"}
          />
        </NotificationBadge>
        <Chip
          label={t("archive.archived")}
          onClick={() =>
            handleFilterChange(filter === "archived" ? "all" : "archived")
          }
          color={filter === "archived" ? "primary" : "default"}
          variant={filter === "archived" ? "filled" : "outlined"}
        />
      </StyledFilterContainer>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : (
        <StyledList>
          {filteredMessages.length === 0 ? (
            <TextBody>
              {showArchived
                ? t("archive.no_archived_messages")
                : t("all_messages_tab.no_messages")}
            </TextBody>
          ) : (
            filteredMessages.map((message) =>
              message.type === "chat" ? (
                <Link
                  key={`chat-${message.id}`}
                  href={routeToGroupChat(message.id)}
                  onClick={(e) => {
                    // Prevent navigation if clicking on the menu button or menu items
                    const target = e.target as HTMLElement;
                    if (
                      target.closest("button") ||
                      target.closest('[role="menu"]')
                    ) {
                      e.preventDefault();
                    }
                  }}
                >
                  <StyledGroupChatListItem
                    groupChat={message.data as GroupChat.AsObject}
                    isArchived={message.isArchived}
                  />
                </Link>
              ) : (
                <Link
                  key={`request-${message.id}`}
                  href={routeToHostRequest(message.id)}
                  onClick={(e) => {
                    // Prevent navigation if clicking on the menu button or menu items
                    const target = e.target as HTMLElement;
                    if (
                      target.closest("button") ||
                      target.closest('[role="menu"]')
                    ) {
                      e.preventDefault();
                    }
                  }}
                >
                  <StyledHostRequestListItem
                    hostRequest={message.data as HostRequest.AsObject}
                    isArchived={message.isArchived}
                  />
                </Link>
              ),
            )
          )}
          {hasMoreMessages && (
            <Button onClick={loadMoreMessages} loading={isFetchingMore}>
              {t("all_messages_tab.load_more")}
            </Button>
          )}
        </StyledList>
      )}
    </StyledWrapper>
  );
}
