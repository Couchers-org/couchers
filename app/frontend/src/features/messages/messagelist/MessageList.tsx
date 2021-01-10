import { Box, BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as React from "react";
import { Message } from "../../../pb/conversations_pb";
import MessageView from "./MessageView";

const useStyles = makeStyles({
  list: {
    display: "flex",
    flexDirection: "column-reverse",
  },
});

export interface MessageListProps extends BoxProps {
  messages: Array<Message.AsObject>;
}

export default function MessageList({ messages }: MessageListProps) {
  const classes = useStyles();

  return (
    <Box className={classes.list}>
      {messages.length ? (
        messages.map((message) => (
          <MessageView key={message.messageId} message={message} />
        ))
      ) : (
        <>No messages</>
      )}
    </Box>
  );
}
