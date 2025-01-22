import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GroupChat } from 'proto/conversations_pb';
import { useAuthContext } from 'features/auth/AuthProvider';
import useUsers from 'features/userQueries/useUsers';
import {
  controlMessage,
  groupChatTitleText,
  isControlMessage,
  messageTargetId,
} from 'features/messages/utils';
import { firstName } from 'utils/names';
import { MESSAGES } from 'i18n/namespaces';
import { Avatar } from 'react-native-paper';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  unread: {
    fontWeight: 'bold',
  },
  skeleton: {
    backgroundColor: '#e0e0e0',
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
});


interface GroupChatListItemProps {
  groupChat: GroupChat.AsObject;
  onPress?: () => void;
}

export default function GroupChatListItem({
  groupChat,
  onPress,
}: GroupChatListItemProps) {
  const { t } = useTranslation(MESSAGES);
  const currentUserId = useAuthContext().authState.userId!;
  const latestMessageAuthorId = groupChat.latestMessage?.authorUserId;
  const isUnread =
    groupChat.lastSeenMessageId !== groupChat.latestMessage?.messageId;

  //It is possible the last message is sent by someone who has left
  //so include it just in case
  const groupChatMembersQuery = useUsers([
    ...groupChat.memberUserIdsList,
    latestMessageAuthorId,
  ]);

  //the avatar is of the latest message author (if it's not the logged in user),
  //otherwise any user that's not the logged in user, otherwise logged in user
  const avatarUserId =
    latestMessageAuthorId !== null && latestMessageAuthorId !== currentUserId
      ? latestMessageAuthorId
      : groupChat.memberUserIdsList.find((id) => id !== currentUserId) ??
        currentUserId;
  //title is the chat title, or all the member's names except current user joined together
  const title = groupChatTitleText(
    groupChat,
    groupChatMembersQuery,
    currentUserId
  );
  //text is the control message text or message text
  let text = "";
  const authorName = firstName(
    groupChatMembersQuery.data?.get(groupChat.latestMessage?.authorUserId)?.name
  );
  if (groupChat.latestMessage && isControlMessage(groupChat.latestMessage)) {
    const targetName = firstName(
      groupChatMembersQuery.data?.get(messageTargetId(groupChat.latestMessage))
        ?.name
    );
    text = controlMessage({
      user: authorName,
      target_user: targetName,
      t,
      message: groupChat.latestMessage,
    });
  } else {
    text = `${authorName}: ${groupChat.latestMessage?.text?.text || ""}`;
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        {groupChatMembersQuery.isLoading ? (
          <View style={styles.skeleton} />
        ) : (
          <Avatar.Image
            source={{ uri: groupChatMembersQuery.data?.get(avatarUserId)?.avatarUrl }}
            size={40}
          />
        )}
      </View>
      <View style={styles.contentContainer}>
        {groupChatMembersQuery.isLoading ? (
          <View style={styles.skeleton} />
        ) : (
          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, isUnread && styles.unread]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {groupChat.muteInfo?.muted && <Text>Muted</Text>}
          </View>
        )}
        {groupChatMembersQuery.isLoading ? (
          <View style={styles.skeleton} />
        ) : (
          <Text
            style={[styles.message, isUnread && styles.unread]}
            numberOfLines={1}
          >
            {text}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
