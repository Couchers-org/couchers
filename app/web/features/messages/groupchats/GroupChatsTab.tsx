import { List } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import TextBody from "components/TextBody";
import CreateGroupChat from "features/messages/groupchats/CreateGroupChat";
import GroupChatListItem from "features/messages/groupchats/GroupChatListItem";
import useMessageListStyles from "features/messages/useMessageListStyles";
import { groupChatsListKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import { ListGroupChatsRes } from "proto/conversations_pb";
import React, { useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "react-query";
import { routeToGroupChat } from "routes";
import { service } from "service";

import useNotifications from "../../useNotifications";

export default function GroupChatsTab() {
  const { t } = useTranslation(MESSAGES);
  const classes = useMessageListStyles();
  const { data: notifications } = useNotifications();
  const unseenMessageCount = notifications?.unseenMessageCount;
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries([groupChatsListKey]);
  }, [unseenMessageCount, queryClient]);

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ListGroupChatsRes.AsObject, RpcError>(
    groupChatsListKey,
    ({ pageParam: lastMessageId }) =>
      service.conversations.listGroupChats(lastMessageId),
    {
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastMessageId,
    }
  );

  const loadMoreChats = () => fetchNextPage();

  return (
    <div className={classes.root}>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : (
        data && (
          <List className={classes.list}>
            <CreateGroupChat className={classes.listItem} />
            {data.pages.map((groupChatsRes, pageNumber) =>
              pageNumber === 0 && groupChatsRes.groupChatsList.length === 0 ? (
                <TextBody key="no-chats-text">
                  {t("group_chats_tab.no_chats_message")}
                </TextBody>
              ) : (
                <React.Fragment key={`group-chats-page-${pageNumber}`}>
                  {groupChatsRes.groupChatsList.map((groupChat) => (
                    <Link
                      key={groupChat.groupChatId}
                      href={routeToGroupChat(groupChat.groupChatId)}
                    >
                      <a>
                        <GroupChatListItem
                          groupChat={groupChat}
                          className={classes.listItem}
                        />
                      </a>
                    </Link>
                  ))}
                </React.Fragment>
              )
            )}

            {hasNextPage && (
              <Button onClick={loadMoreChats} loading={isFetchingNextPage}>
                {t("group_chats_tab.load_more_button_label")}
              </Button>
            )}
          </List>
        )
      )}
    </div>
  );
}
