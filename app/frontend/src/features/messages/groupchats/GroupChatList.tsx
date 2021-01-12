import { Box, Link } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { GroupChat } from "../../../pb/conversations_pb";
import GroupChatListItem from "./GroupChatListItem";

const useStyles = makeStyles({ root: {} });

interface GroupChatListProps {
  groupChats: GroupChat.AsObject[];
  setGroupChat: (groupChat: GroupChat.AsObject) => void;
}

export default function GroupChatList({
  groupChats,
  setGroupChat,
}: GroupChatListProps) {
  const classes = useStyles();

  return (
    <>
      <Box className={classes.root}>
        {groupChats.map((groupChat) => (
          <Link
            key={groupChat.groupChatId}
            onClick={() => setGroupChat(groupChat)}
          >
            <GroupChatListItem groupChat={groupChat} />
          </Link>
        ))}
      </Box>
    </>
  );
}
