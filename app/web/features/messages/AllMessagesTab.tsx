import { Chip, List, styled } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import NotificationBadge from "components/NotificationBadge";
import TextBody from "components/TextBody";
import {
  MESSAGE_FILTER_TYPES,
  messageFilterToRequest,
  MessageFilterType,
} from "features/messages/constants";
import CreateGroupChat from "features/messages/groupchats/CreateGroupChat";
import GroupChatListItem from "features/messages/groupchats/GroupChatListItem";
import MyPublicTripsMessages from "features/messages/MyPublicTripsMessages";
import HostRequestListItem from "features/messages/requests/HostRequestListItem";
import useMessageListsAutoRefetch from "features/messages/useMessageListsAutoRefetch";
import { messageThreadsListKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { ListMessageThreadsRes, MessageThread } from "proto/conversations_pb";
import React from "react";
import { routeToGroupChat, routeToHostRequest } from "routes";
import { service } from "service";
import { theme } from "theme";
import useOnVisibleEffect from "utils/useOnVisibleEffect";

import useNotifications from "../useNotifications";

const PAGE_SIZE = 25;
const isPublicTripsEnabled = process.env.NODE_ENV !== "production";

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

// clicking the overflow menu / its items shouldn't navigate into the thread
function guardMenuNavigation(e: React.MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.closest("button") || target.closest('[role="menu"]')) {
    e.preventDefault();
  }
}

export default function AllMessagesTab() {
  const { t } = useTranslation(MESSAGES);
  const router = useRouter();
  const { data: notifications } = useNotifications();

  useMessageListsAutoRefetch();

  // Get filter from URL path, default to "all"
  const slugs =
    typeof router.query.slug === "undefined"
      ? ["all"]
      : typeof router.query.slug === "string"
        ? [router.query.slug]
        : router.query.slug;

  const filterFromPath = slugs[0] as MessageFilterType;
  const filter: MessageFilterType =
    MESSAGE_FILTER_TYPES.includes(filterFromPath) &&
    (filterFromPath !== "public-trips" || isPublicTripsEnabled)
      ? filterFromPath
      : "all";

  const showArchived = filter === "archived";
  const isGroupedView = filter === "public-trips";
  const { categories, onlyUnread, onlyArchived } = messageFilterToRequest(filter);

  const handleFilterChange = (newFilter: MessageFilterType) => {
    router.push(`/messages/${newFilter}`);
  };

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ListMessageThreadsRes.AsObject, RpcError>({
    queryKey: messageThreadsListKey({ filter, onlyArchived }),
    queryFn: ({ pageParam }) =>
      service.conversations.listMessageThreads({
        categories,
        onlyUnread,
        onlyArchived,
        pageToken: pageParam as string | undefined,
        count: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    initialPageParam: undefined,
    enabled: !isGroupedView,
  });

  const threads = data?.pages.flatMap((page) => page.threadsList) ?? [];

  const { ref: loadMoreRef } = useOnVisibleEffect(
    hasNextPage && !isFetchingNextPage ? fetchNextPage : undefined,
  );

  // Unread badge counts (role-based, from the ping). hosting + surfing already
  // include public-trip offers, so "all" is chats + hosting + surfing.
  const unseenChatsCount = notifications?.unseenMessageCount ?? 0;
  const unseenHostingCount = notifications?.unseenHostingHostRequestCount ?? 0;
  const unseenSurfingCount = notifications?.unseenSurfingHostRequestCount ?? 0;
  const unseenPublicTripsCount = notifications?.unseenPublicTripOfferCount ?? 0;
  const unseenAllCount =
    unseenChatsCount + unseenHostingCount + unseenSurfingCount;

  const renderThread = (thread: MessageThread.AsObject) => {
    if (thread.groupChat) {
      return (
        <Link
          key={`chat-${thread.groupChat.groupChatId}`}
          href={routeToGroupChat(thread.groupChat.groupChatId)}
          onClick={guardMenuNavigation}
        >
          <StyledGroupChatListItem
            groupChat={thread.groupChat}
            isArchived={showArchived}
          />
        </Link>
      );
    }
    if (thread.hostRequest) {
      return (
        <Link
          key={`request-${thread.hostRequest.hostRequestId}`}
          href={routeToHostRequest(thread.hostRequest.hostRequestId)}
          onClick={guardMenuNavigation}
        >
          <StyledHostRequestListItem
            hostRequest={thread.hostRequest}
            isArchived={showArchived}
          />
        </Link>
      );
    }
    return null;
  };

  const emptyStateText = showArchived
    ? t("archive.no_archived_messages")
    : t("all_messages_tab.no_messages");

  let messagesContent;
  if (isGroupedView) {
    messagesContent = <MyPublicTripsMessages />;
  } else if (error) {
    messagesContent = <Alert severity="error">{error.message}</Alert>;
  } else if (isLoading) {
    messagesContent = <CenteredSpinner />;
  } else {
    messagesContent = (
      <StyledList>
        {threads.length === 0 ? (
          <TextBody>{emptyStateText}</TextBody>
        ) : (
          threads.map(renderThread)
        )}
        {hasNextPage && (
          <div ref={loadMoreRef}>
            <CenteredSpinner />
          </div>
        )}
      </StyledList>
    );
  }

  return (
    <StyledWrapper>
      {!showArchived && !isGroupedView && <StyledCreateGroupChatButton />}
      <StyledFilterContainer>
        <NotificationBadge count={unseenAllCount}>
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
        {isPublicTripsEnabled && (
          <NotificationBadge count={unseenPublicTripsCount}>
            <Chip
              label={t("messages_page.tabs.public_trips")}
              onClick={() => handleFilterChange("public-trips")}
              color={filter === "public-trips" ? "primary" : "default"}
              variant={filter === "public-trips" ? "filled" : "outlined"}
            />
          </NotificationBadge>
        )}
        <Chip
          label={t("archive.archived")}
          onClick={() =>
            handleFilterChange(filter === "archived" ? "all" : "archived")
          }
          color={filter === "archived" ? "primary" : "default"}
          variant={filter === "archived" ? "filled" : "outlined"}
        />
      </StyledFilterContainer>
      {messagesContent}
    </StyledWrapper>
  );
}
