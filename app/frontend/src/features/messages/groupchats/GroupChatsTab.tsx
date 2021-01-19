import { Box, List } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { useQuery } from "react-query";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { Error as GrpcError } from "grpc-web";
import { GroupChat } from "../../../pb/conversations_pb";
import CreateGroupChat from "./CreateGroupChat";
import { service } from "../../../service";
import { messagesRoute } from "../../../AppRoutes";
import TextBody from "../../../components/TextBody";
import GroupChatListItem from "./GroupChatListItem";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  root: {},
  list: {
    //margin won't go on the right, so make the width longer
    width: `calc(100% + ${theme.spacing(4)})`,
  },
  link: {
    color: "inherit",
    textDecoration: "none",
    "&:hover": { textDecoration: "none" },
  },
  listItem: {
    marginInline: `-${theme.spacing(2)}`,
    paddingInline: `${theme.spacing(2)}`,
  },
}));

export default function GroupChatsTab() {
  const classes = useStyles();

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
                  to={`${messagesRoute}/groupchats/${groupChat.groupChatId}`}
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
