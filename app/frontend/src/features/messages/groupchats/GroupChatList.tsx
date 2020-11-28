import { Box, BoxProps, Link } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { GroupChat } from "../../../pb/conversations_pb";
import GroupChatItem from "./GroupChatItem";

const useStyles = makeStyles({ root: {} });

export interface GroupChatListProps extends BoxProps {
  setGroupChat: (groupChat: GroupChat.AsObject) => void;
  groupChats: Array<GroupChat.AsObject>;
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
            <GroupChatItem groupChat={groupChat} />
          </Link>
        ))}
      </Box>
    </>
  );
}
