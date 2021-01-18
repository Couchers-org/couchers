import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { Link } from "react-router-dom";
import { messagesRoute } from "../../../AppRoutes";
import TextBody from "../../../components/TextBody";
import { GroupChat } from "../../../pb/conversations_pb";
import GroupChatListItem from "./GroupChatListItem";

const useStyles = makeStyles({
  root: {},
  link: { textDecoration: "none", "&:hover": { textDecoration: "none" } },
});

interface GroupChatListProps {
  groupChats: GroupChat.AsObject[];
}

export default function GroupChatList({ groupChats }: GroupChatListProps) {
  const classes = useStyles();

  return (
    /// TODO : Pretty empty state
    <>
      <Box className={classes.root}>
        {groupChats.length === 0 ? (
          <TextBody>No group chats yet.</TextBody>
        ) : (
          groupChats.map((groupChat) => (
            <Link
              key={groupChat.groupChatId}
              to={`${messagesRoute}/groupchats/${groupChat.groupChatId}`}
              className={classes.link}
            >
              <GroupChatListItem groupChat={groupChat} />
            </Link>
          ))
        )}
      </Box>
    </>
  );
}
