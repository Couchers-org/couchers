import { Box, List } from "@material-ui/core";
import { Error as GrpcError } from "grpc-web";
import React from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";

import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import TextBody from "../../../components/TextBody";
import { GroupChat } from "../../../pb/conversations_pb";
import { routeToGroupChat } from "../../../routes";
import { service } from "../../../service";
import useMessageListStyles from "../useMessageListStyles";
import CreateGroupChat from "./CreateGroupChat";
import GroupChatListItem from "./GroupChatListItem";

export default function GroupChatsTab() {
  const classes = useMessageListStyles();

  /// TODO: Pagination
  const { data: groupChats, isLoading, error } = useQuery<
    GroupChat.AsObject[],
    GrpcError
  >(["groupChats"], () => service.conversations.listGroupChats());

  return (
    <Box className={classes.root}>
      {error && <Alert severity={"error"}>{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : (
        groupChats && (
          <List className={classes.list}>
            <CreateGroupChat className={classes.listItem} />
            {groupChats.length === 0 ? (
              <TextBody>No group chats yet.</TextBody>
            ) : (
              groupChats.map((groupChat) => (
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
              ))
            )}
          </List>
        )
      )}
    </Box>
  );
}
