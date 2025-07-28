import { styled } from "@mui/material";
import classNames from "classnames";
import TextBody from "components/TextBody";
import ControlMessageView from "features/messages/messagelist/ControlMessageView";
import MessageView from "features/messages/messagelist/MessageView";
import { isControlMessage } from "features/messages/utils";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { Message } from "proto/conversations_pb";
import * as React from "react";

const List = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column-reverse",
  paddingBlock: theme.spacing(2),
}));

const MessageWrapper = styled(ControlMessageView)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "&:nth-child(1)": {
    marginBottom: 0,
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

  return (
    <List className={className} data-testid="message-list">
      {messages.length ? (
        messages.map((message) =>
          isControlMessage(message) ? (
              <StyledControlMessageView
                key={message.messageId}
                onVisible={() => markLastSeen(message.messageId)}
                message={message}
              />
          ) : (
              <StyledMessageView
                key={message.messageId}
                onVisible={() => markLastSeen(message.messageId)}
                message={message}
              />
          ),
        )
      ) : (
        <TextBody>{t("chat_view.no_messages_state_text")}</TextBody>
      )}
    </List>
  );
}
