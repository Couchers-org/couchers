import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthContext } from "features/auth/AuthProvider";
import {
  controlMessage,
  isControlMessage,
  messageTargetId,
} from "features/messages/utils";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useUser } from "features/userQueries/useUsers";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { HostRequest } from "proto/requests_pb";
import dayjs from "utils/dayjs";
import { firstName } from "utils/names";

import { Avatar } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { capitalize } from '@/utils/capitalize';
import HostRequestStatusIcon from './HostRequestStatusIcon';
import HostRequestStatusText from './HostRequestStatusText';

const styles = StyleSheet.create({
  hostStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unread: {
    fontWeight: 'bold',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
  },
  messagePreview: {
    marginTop: 4,
  },
  dates: {
    marginTop: 4,
  },
  skeleton: {
    backgroundColor: '#e0e0e0',
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
});

export interface HostRequestListItemProps {
  hostRequest: HostRequest.AsObject;
  style?: object;
}

export default function HostRequestListItem({
  hostRequest,
  style,
}: HostRequestListItemProps) {
  const { t } = useTranslation(MESSAGES);
  const { authState } = useAuthContext();
  const isHost = authState.userId === hostRequest.hostUserId;
  const user = useCurrentUser();
  if (user === undefined) {
    return null;
  }
  const currentUser = user.data;
  const { data: otherUser, isLoading: isOtherUserLoading } = useUser(
    isHost ? hostRequest.surferUserId : hostRequest.hostUserId
  );
  const isUnread =
    hostRequest.lastSeenMessageId !== hostRequest.latestMessage?.messageId;
  //define the latest message author's name and
  //control message target to use in short message preview
  const authorName =
    hostRequest?.latestMessage?.authorUserId === authState.userId
      ? firstName(currentUser?.name) || ""
      : firstName(otherUser?.name) || "";

  const targetName = hostRequest?.latestMessage
    ? messageTargetId(hostRequest.latestMessage) === authState.userId
      ? firstName(currentUser?.name) || ""
      : firstName(otherUser?.name) || ""
    : "";

  //text is the control message text or message text, truncated
  const latestMessageText = hostRequest.latestMessage
    ? isControlMessage(hostRequest.latestMessage)
      ? controlMessage({
          message: hostRequest.latestMessage,
          user: authorName,
          target_user: targetName,
          t,
        })
      : //if it's a normal message, show "<User's Name>: <The message>"
        `${capitalize(authorName)}: ${
          hostRequest.latestMessage.text?.text || ""
        }`
    : "";

  return (
    <View style={[styles.container, style]}>
      {isOtherUserLoading ? (
        <View style={styles.skeleton} />
      ) : (
        <Avatar.Image
          source={{ uri: otherUser?.avatarUrl }}
        />
      )}
      <View style={styles.contentContainer}>
        <ThemedText>
          {!otherUser ? 'Loading...' : otherUser.name}
        </ThemedText>
        <View style={styles.hostStatusContainer}>
          <HostRequestStatusIcon
            hostRequest={hostRequest}
          />
          {isOtherUserLoading ? (
            <Text>Loading...</Text>
          ) : (
            <HostRequestStatusText
              isHost={isHost}
              requestStatus={hostRequest.status}
            />
          )}
        </View>
        <Text style={styles.dates}>
          {`${dayjs(hostRequest.fromDate).format("LL")} - ${dayjs(
            hostRequest.toDate
          ).format("LL")}`}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.messagePreview, isUnread && styles.unread]}
        >
          {isOtherUserLoading ? 'Loading...' : latestMessageText}
        </Text>
      </View>
    </View>
  );
}
