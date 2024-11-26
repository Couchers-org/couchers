import makeStyles from "@mui/styles/makeStyles";
import classNames from "classnames";
import TextBody from "components/TextBody";
import ControlMessageView from "features/messages/messagelist/ControlMessageView";
import MessageView from "features/messages/messagelist/MessageView";
import { isControlMessage } from "features/messages/utils";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { Message } from "proto/conversations_pb";
import * as React from "react";

const useStyles = makeStyles((theme) => ({
  list: {
    display: "flex",
    flexDirection: "column-reverse",
    paddingBlock: theme.spacing(2),
  },
  message: {
    "&:nth-child(1)": {
      marginBottom: 0,
    },
    marginBottom: theme.spacing(2),
  },
}));

export interface MessageListProps {
  messages: Array<Message.AsObject>;
  markLastSeen(messageId: number): void;
  className?: string;
}

export default function MessageList({
  markLastSeen,
  messages,
  className,
}: MessageListProps) {
  const { t } = useTranslation(MESSAGES);
  const classes = useStyles();

  return (
    <div
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
        <TextBody>{t("chat_view.no_messages_state_text")}</TextBody>
      )}
    </div>
  );
}
