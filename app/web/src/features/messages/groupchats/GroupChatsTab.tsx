import { Box, List } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import TextBody from "components/TextBody";
import { LOAD_MORE, NO_CHAT } from "features/messages/constants";
import CreateChat from "features/messages/chats/CreateChat";
import ChatListItem from "features/messages/chats/ChatListItem";
import useMessageListStyles from "features/messages/useMessageListStyles";
import { Error as GrpcError } from "grpc-web";
import { ListChatsRes } from "proto/conversations_pb";
import { chatsListKey } from "queryKeys";
import React, { useEffect } from "react";
import { useInfiniteQuery } from "react-query";
import { Link } from "react-router-dom";
import { queryClient } from "reactQueryClient";
import { routeToChat } from "routes";
import { service } from "service";

import useNotifications from "../../useNotifications";

export default function ChatsTab() {
  const classes = useMessageListStyles();
  const { data: notifications } = useNotifications();
  const unseenMessageCount = notifications?.unseenMessageCount;

  useEffect(() => {
    queryClient.invalidateQueries([chatsListKey]);
  }, [unseenMessageCount]);

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ListChatsRes.AsObject, GrpcError>(
    chatsListKey,
    ({ pageParam: lastMessageId }) =>
      service.conversations.listChats(lastMessageId),
    {
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastMessageId,
    }
  );

  const loadMoreChats = () => fetchNextPage();

  return (
    <Box className={classes.root}>
      {error && <Alert severity={"error"}>{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : (
        data && (
          <List className={classes.list}>
            <CreateChat className={classes.listItem} />
            {data.pages.map((chatsRes, pageNumber) =>
              pageNumber === 0 && chatsRes.chatsList.length === 0 ? (
                <TextBody key="no-chats-text">{NO_CHAT}</TextBody>
              ) : (
                <React.Fragment key={`group-chats-page-${pageNumber}`}>
                  {chatsRes.chatsList.map((chat) => (
                    <Link key={chat.chatId} to={routeToChat(chat.chatId)}>
                      <ChatListItem chat={chat} className={classes.listItem} />
                    </Link>
                  ))}
                </React.Fragment>
              )
            )}

            {hasNextPage && (
              <Button onClick={loadMoreChats} loading={isFetchingNextPage}>
                {LOAD_MORE}
              </Button>
            )}
          </List>
        )
      )}
    </Box>
  );
}
