import TextBody from "@/components/TextBody";
import React from "react";
import { useTranslation } from "@/i18n";
import { MESSAGES } from "@/i18n/namespaces";
import { timestamp2Date } from "../../../utils/date";
import { firstName } from "../../../utils/names";
import { useUser } from "@/features/userQueries/useUsers";
import { controlMessage, messageTargetId } from "@/features/messages/utils";
import TimeInterval from "@/features/messages/messagelist/TimeInterval";
import { View, StyleSheet } from "react-native";
import CircularProgress from "@/components/CircularProgress";
import { MessageProps } from "./MessageView";
import { messageElementId } from "./MessageView";

const styles = StyleSheet.create({
  container: {
    display: "flex",
    alignItems: "center",
  },
});

export default function ControlMessageView({
  message,
}: MessageProps) {
  const { t } = useTranslation(MESSAGES);
  const { data: author, isLoading: isAuthorLoading } = useUser(
    message.authorUserId
  );
  const { data: target, isLoading: isTargetLoading } = useUser(
    messageTargetId(message)
  );

  const authorName = firstName(author?.name);
  const targetName = firstName(target?.name);

  return (
    <View
      key={messageElementId(message.messageId)}
      style={styles.container}
    >
      <View >
        <TimeInterval date={timestamp2Date(message.time!)} />
      </View>

      <View>
        {!isAuthorLoading && !isTargetLoading ? (
          <TextBody>
            {controlMessage({
              message,
              user: authorName,
              target_user: targetName,
              t,
            })}
          </TextBody>
        ) : (
          <CircularProgress />
        )}
      </View>
    </View>
  );
}
