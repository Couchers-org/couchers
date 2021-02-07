import { Box, BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import * as React from "react";

import TextBody from "../../../components/TextBody";
import { Message } from "../../../pb/conversations_pb";
import { isControlMessage } from "../utils";
import ControlMessageView from "./ControlMessageView";
import MessageView from "./MessageView";

const useStyles = makeStyles((theme) => ({
  list: {
    display: "flex",
    flexDirection: "column-reverse",
  },
  message: {
    marginBottom: theme.spacing(2),
    "&:nth-child(1)": {
      marginBottom: 0,
    },
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
              onVisible={markLastSeen}
              message={message}
              className={classes.message}
            />
          ) : (
            <MessageView
              key={message.messageId}
              onVisible={markLastSeen}
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
