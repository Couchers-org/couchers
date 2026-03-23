import { Chip, List, styled } from "@mui/material";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import TextBody from "components/TextBody";
import CreateGroupChat from "features/messages/groupchats/CreateGroupChat";
import GroupChatListItem from "features/messages/groupchats/GroupChatListItem";
import { groupChatsListKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import { ListGroupChatsRes } from "proto/conversations_pb";
import React, { useEffect, useState } from "react";
import { routeToGroupChat } from "routes";
import { service } from "service";
import { theme } from "theme";

import useNotifications from "../../useNotifications";

const StyledWrapper = styled("div")(() => ({
  padding: theme.spacing(0, 2),
}));

const StyledList = styled(List)(() => ({
  width: "100%",
}));

const StyledCreateGroupChatListItem = styled(CreateGroupChat)(() => ({
  marginInline: `-${theme.spacing(2)}`,
  paddingInline: `${theme.spacing(2)}`,
}));

const StyledGroupChatListItem = styled(GroupChatListItem)(() => ({
  marginInline: `-${theme.spacing(2)}`,
  paddingInline: `${theme.spacing(2)}`,
}));

const StyledToggleContainer = styled("div")(() => ({
  display: "flex",
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export default function GroupChatsTab() {
  const [showArchived, setShowArchived] = useState(false);
  const { t } = useTranslation(MESSAGES);
  const { data: notifications } = useNotifications();
  const unseenMessageCount = notifications?.unseenMessageCount;
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: [groupChatsListKey],
    });
  }, [unseenMessageCount, queryClient]);

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ListGroupChatsRes.AsObject, RpcError>({
    queryKey: [groupChatsListKey({ onlyArchived: showArchived })],
    queryFn: ({ pageParam: lastMessageId }) =>
      service.conversations.listGroupChats(
        lastMessageId as number | undefined,
        10,
        showArchived,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.noMore ? undefined : lastPage.lastMessageId,
    initialPageParam: undefined,
  });

  const loadMoreChats = () => fetchNextPage();

  return (
    <StyledWrapper>
      <StyledToggleContainer>
        <Chip
          label={t("archive.archived")}
          onClick={() => setShowArchived(!showArchived)}
          color={showArchived ? "primary" : "default"}
          variant={showArchived ? "filled" : "outlined"}
        />
      </StyledToggleContainer>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : (
        data && (
          <StyledList>
            {!showArchived && <StyledCreateGroupChatListItem />}
            {data.pages.map((groupChatsRes, pageNumber) =>
              pageNumber === 0 && groupChatsRes.groupChatsList.length === 0 ? (
                <TextBody key="no-chats-text">
                  {showArchived
                    ? t("archive.no_archived_chats")
                    : t("group_chats_tab.no_chats_message")}
                </TextBody>
              ) : (
                <React.Fragment key={`group-chats-page-${pageNumber}`}>
                  {groupChatsRes.groupChatsList.map((groupChat) => (
                    <Link
                      key={groupChat.groupChatId}
                      href={routeToGroupChat(groupChat.groupChatId)}
                    >
                      <StyledGroupChatListItem
                        groupChat={groupChat}
                        isArchived={showArchived}
                      />
                    </Link>
                  ))}
                </React.Fragment>
              ),
            )}

            {hasNextPage && (
              <Button onClick={loadMoreChats} loading={isFetchingNextPage}>
                {t("group_chats_tab.load_more_button_label")}
              </Button>
            )}
          </StyledList>
        )
      )}
    </StyledWrapper>
  );
}
