import { Box, BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import TextBody from "components/TextBody";
import ControlMessageView from "features/messages/messagelist/ControlMessageView";
import MessageView from "features/messages/messagelist/MessageView";
import { isControlMessage } from "features/messages/utils";
import { Message } from "pb/conversations_pb";
import * as React from "react";

const useStyles = makeStyles((theme) => ({
  list: {
    display: "flex",
    flexDirection: "column-reverse",
  },
  message: {
    "&:nth-child(1)": {
      marginBottom: 0,
    },
    marginBottom: theme.spacing(2),
  },
}));

export interface MessageListProps extends BoxProps {
  messages: Array<Message.AsObject>;
  markLastSeen(messageId: number): void;
  className?: string;
}

export default function MessageList({
  markLastSeen,
  messages,
  className,
}: MessageListProps) {
  const classes = useStyles();

  return (
    <Box
      className={classNames(classes.list, className)}
      data-testid="message-list"
    >
      {messages.length ? (
        messages.map((message) =>
          isControlMessage(message) ? (
            <ControlMessageView
              key={message.messageId}
              onVisible={() => markLastSeen(message.messageId)}
              message={message}
              className={classes.message}
            />
          ) : (
            <MessageView
              key={message.messageId}
              onVisible={() => markLastSeen(message.messageId)}
              message={message}
              className={classes.message}
            />
          )
        )
      ) : (
        <TextBody>No messages</TextBody>
      )}
    </Box>
  );
}
