import { Box, BoxProps, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { GroupChat } from "../../../pb/conversations_pb";
import MessageView from "../messagelist/Message";

const useStyles = makeStyles({ root: {} });

export interface GroupChatViewProps extends BoxProps {
  groupChat: GroupChat.AsObject;
}

export default function GroupChatItem({ groupChat }: GroupChatViewProps) {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Typography variant={"h3"}>{groupChat.title}</Typography>
      {groupChat.latestMessage && (
        <MessageView message={groupChat.latestMessage} />
      )}
    </Box>
  );
}
