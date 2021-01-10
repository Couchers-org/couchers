import { Box, BoxProps, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { GroupChat } from "../../../pb/conversations_pb";
import ControlMessageView from "../messagelist/ControlMessageView";
import MessageView from "../messagelist/MessageView";
import { isControlMessage } from "../utils";

const useStyles = makeStyles({ root: {} });

export interface GroupChatListItemProps extends BoxProps {
  groupChat: GroupChat.AsObject;
}

export default function GroupChatListItem({
  groupChat,
}: GroupChatListItemProps) {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Typography variant="h3">{groupChat.title}</Typography>
      {groupChat.latestMessage &&
        ///TODO: This should be a seperate preview widget, not a normal messageview
        (isControlMessage(groupChat.latestMessage) ? (
          <ControlMessageView message={groupChat.latestMessage} />
        ) : (
          <MessageView message={groupChat.latestMessage} />
        ))}
    </Box>
  );
}
