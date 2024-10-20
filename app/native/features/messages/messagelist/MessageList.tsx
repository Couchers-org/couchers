import { FlatList, StyleSheet, View } from "react-native";
import TextBody from "components/TextBody";
import { isControlMessage } from "features/messages/utils";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { Message } from "proto/conversations_pb";
import * as React from "react";
import MessageView from "./MessageView";
import ControlMessageView from "./ControlMessageView";

const styles = StyleSheet.create({
  contentContainer: {
    padding: 10,
  },
  container: {
    paddingBottom: 150,
  },
});

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

  const renderItem = ({ item: message }: { item: Message.AsObject }) => (
    isControlMessage(message) ? (
      <ControlMessageView
        key={message.messageId}
        onVisible={() => markLastSeen(message.messageId)}
        message={message}
      />
    ) : (
      <MessageView
        key={message.messageId}
        onVisible={() => markLastSeen(message.messageId)}
        message={message}
      />
    )
  );

  const emptyListComponent = () => (
    <TextBody>{t("chat_view.no_messages_state_text")}</TextBody>
  );

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.contentContainer}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.messageId.toString()}
        ListEmptyComponent={emptyListComponent}
        inverted
      />
    </View>
  );
}
