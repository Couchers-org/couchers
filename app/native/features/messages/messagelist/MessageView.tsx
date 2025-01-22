import { ThemedText } from "@/components/ThemedText";
import useCurrentUser from "@/features/userQueries/useCurrentUser";
import { useUser } from "@/features/userQueries/useUsers";
import { Message } from "@/proto/conversations_pb";
import { View } from "react-native";
import TimeInterval from "./TimeInterval";
import { timestamp2Date } from "@/utils/date";
import { Avatar } from "react-native-paper";
import CircularProgress from "@/components/CircularProgress";
import Button from "@/components/Button";
import { StyleSheet } from "react-native";

export const messageElementId = (id: number) => `message-${id}`;

export interface MessageProps {
  message: Message.AsObject;
  onVisible?(): void;
  className?: string;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  messageContent: {
    margin: 10,
    flex: 1,
    backgroundColor: "white",
    padding: 4,
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    elevation: 7,
    shadowOffset: { width: 1, height: 1 },
    shadowRadius: 3,
    shadowOpacity: 0.5,
  },
  currentUserMessage: {
    borderColor: "#e47701",
    shadowColor: "#e47701",
  },
  otherUserMessage: {
    borderColor: "#00a398",
    shadowColor: "#00a398",
  },
  authorName: {
    fontWeight: "bold",
  },
  flagButton: {
    marginTop: 5,
    padding: 2,
    borderRadius: 5,
    alignItems: "center",
  },
});

export default function MessageView({
  message,
  onVisible,
  className,
}: MessageProps) {
  const { data: author, isLoading: isAuthorLoading } = useUser(
    message.authorUserId
  );
  const user = useCurrentUser();
  if (!user) {
    return null;
  }
  const { data: currentUser, isLoading: isCurrentUserLoading } = user;
  const isLoading = isAuthorLoading || isCurrentUserLoading;
  const isCurrentUser = author?.userId === currentUser?.userId;

  return (
    <View style={styles.container} id={messageElementId(message.messageId)}>
      {isLoading && <CircularProgress />}
      {author && !isCurrentUser && (
        <View>
          <Avatar.Image size={48} source={{ uri: author.avatarUrl }} />
          <Button title="Report" onPress={() => {}} style={styles.flagButton} />
        </View>
      )}
      <View
        style={[
          styles.messageContent,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        <View >
          {author ? (
            <ThemedText style={styles.authorName}>{author.name}</ThemedText>
          ) : (
            <ThemedText>Loading...</ThemedText>
          )}
          {!isCurrentUser && (
            <TimeInterval date={timestamp2Date(message.time!)} />
          )}
        </View>

        <View>
          <ThemedText>{message.text?.text || ""}</ThemedText>
        </View>

        {isCurrentUser && (
          <View>
            <TimeInterval date={timestamp2Date(message.time!)} />
          </View>
        )}
      </View>
      {author && isCurrentUser && (
        <Avatar.Image size={48} source={{ uri: author.avatarUrl }} />
      )}
    </View>
  );
}
