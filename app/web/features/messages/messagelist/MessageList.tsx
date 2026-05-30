import { styled } from "@mui/material";
import TextBody from "components/TextBody";
import ControlMessageView from "features/messages/messagelist/ControlMessageView";
import { isControlMessage } from "features/messages/utils";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { Message } from "proto/conversations_pb";
import * as React from "react";
import { theme } from "theme";

import MessageView from "./MessageView";

const List = styled("div")(() => ({
  display: "flex",
  flexDirection: "column-reverse",
  paddingBlock: theme.spacing(2),
}));

const MessageWrapper = styled(MessageView)(() => ({
  marginBottom: theme.spacing(1),
  "&:nth-of-type(1)": {
    marginBottom: 0,
  },
  [theme.breakpoints.up("md")]: {
    marginBottom: theme.spacing(2),
  },
}));

const ControlMessageWrapper = styled(ControlMessageView)(() => ({
  marginBottom: theme.spacing(1),
  "&:nth-of-type(1)": {
    marginBottom: 0,
  },
  [theme.breakpoints.up("md")]: {
    marginBottom: theme.spacing(2),
  },
}));

interface MessageListProps {
  messages: Array<Message.AsObject>;
  markLastSeen(messageId: number): void;
  className?: string;
  isDm?: boolean;
}

export default function MessageList({
  markLastSeen,
  messages,
  className,
  isDm = false,
}: MessageListProps) {
  const { t } = useTranslation(MESSAGES);

  return (
    <List className={className} data-testid="message-list">
      {messages.length ? (
        messages.map((message) =>
          isControlMessage(message) ? (
            <ControlMessageWrapper
              key={message.messageId}
              onVisible={() => markLastSeen(message.messageId)}
              message={message}
            />
          ) : (
            <MessageWrapper
              key={message.messageId}
              onVisible={() => markLastSeen(message.messageId)}
              message={message}
              isDm={isDm}
            />
          ),
        )
      ) : (
        <TextBody>{t("chat_view.no_messages_state_text")}</TextBody>
      )}
    </List>
  );
}
