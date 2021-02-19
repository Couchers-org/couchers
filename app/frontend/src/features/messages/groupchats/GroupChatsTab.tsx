import { Box, List } from "@material-ui/core";
import { Error as GrpcError } from "grpc-web";
import React from "react";
import { useInfiniteQuery } from "react-query";
import { Link } from "react-router-dom";

import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import CircularProgress from "../../../components/CircularProgress";
import TextBody from "../../../components/TextBody";
import { ListGroupChatsRes } from "../../../pb/conversations_pb";
import { routeToGroupChat } from "../../../routes";
import { service } from "../../../service";
import useMessageListStyles from "../useMessageListStyles";
import CreateGroupChat from "./CreateGroupChat";
import GroupChatListItem from "./GroupChatListItem";

export default function GroupChatsTab() {
  const classes = useMessageListStyles();

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ListGroupChatsRes.AsObject, GrpcError>(
    ["groupChats"],
    ({ pageParam: lastMessageId }) =>
      service.conversations.listGroupChats(lastMessageId),
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
            <CreateGroupChat className={classes.listItem} />
            {data.pages.map((groupChatsRes, pageNumber) =>
              pageNumber === 0 && groupChatsRes.groupChatsList.length === 0 ? (
                <TextBody key="no-chats-text">No group chats yet.</TextBody>
              ) : (
                <React.Fragment key={`group-chats-page-${pageNumber}`}>
                  {groupChatsRes.groupChatsList.map((groupChat) => (
                    <Link
                      key={groupChat.groupChatId}
                      to={routeToGroupChat(groupChat.groupChatId)}
                      className={classes.link}
                    >
                      <GroupChatListItem
                        groupChat={groupChat}
                        className={classes.listItem}
                      />
                    </Link>
                  ))}
                </React.Fragment>
              )
            )}

            {hasNextPage && (
              <Button onClick={loadMoreChats} loading={isFetchingNextPage}>
                Load more
              </Button>
            )}
          </List>
        )
      )}
    </Box>
  );
}
