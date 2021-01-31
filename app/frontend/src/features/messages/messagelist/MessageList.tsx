import { Box, BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as React from "react";
import TextBody from "../../../components/TextBody";
import { Message } from "../../../pb/conversations_pb";
import { isControlMessage } from "../utils";
import ControlMessageView from "./ControlMessageView";
import MessageView from "./MessageView";

const useStyles = makeStyles({
  list: {
    display: "flex",
    flexDirection: "column-reverse",
  },
});

export interface MessageListProps extends BoxProps {
  messages: Array<Message.AsObject>;
  markLastSeen(messageId: number): void;
}

export default function MessageList({
  markLastSeen,
  messages,
}: MessageListProps) {
  const classes = useStyles();

  return (
    <Box className={classes.list} data-testid="message-list">
      {messages.length ? (
        messages.map((message) =>
          isControlMessage(message) ? (
            <ControlMessageView
              key={message.messageId}
              onVisible={markLastSeen}
              message={message}
            />
          ) : (
            <MessageView
              key={message.messageId}
              onVisible={markLastSeen}
              message={message}
            />
          )
        )
      ) : (
        <TextBody>No messages</TextBody>
      )}
    </Box>
  );
}
