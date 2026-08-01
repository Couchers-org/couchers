import { GroupChat } from "couchers/proto/conversations_pb";
import { Message } from "couchers/proto/messages_pb";
import { HostRequest } from "couchers/proto/requests_pb";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { TFunction } from "i18next";
import { firstName } from "utils/names";

import {
  requestStatusChangedMessageToSelfTransKey,
  requestStatusChangedMessageToTransKey,
} from "./constants";

type Conversation = GroupChat.AsObject | HostRequest.AsObject;

export function hasUnreadMessages<T extends Conversation>(
  conversation: T,
): conversation is T & { latestMessage: Message.AsObject } {
  return (
    conversation.latestMessage !== undefined &&
    conversation.lastSeenMessageId < conversation.latestMessage.messageId
  );
}

export function isControlMessage(message: Message.AsObject) {
  return !message.text;
}

export function messageTargetId(message: Message.AsObject) {
  return message.userInvited
    ? message.userInvited.targetUserId
    : message.userMadeAdmin
      ? message.userMadeAdmin.targetUserId
      : message.userRemovedAdmin
        ? message.userRemovedAdmin.targetUserId
        : undefined;
}

export function controlMessage({
  user,
  target_user,
  message,
  t,
  isCurrentUser,
}: {
  user: string;
  target_user?: string;
  message: Message.AsObject;
  t: TFunction<"messages", undefined>;
  isCurrentUser?: boolean;
}) {
  const userCap = user.charAt(0).toUpperCase() + user.slice(1);
  if (message.chatCreated) {
    return t("control_message.created_chat_text", { user: userCap });
  } else if (message.chatEdited) {
    return t("control_message.edited_chat_text", { user: userCap });
  } else if (message.userInvited) {
    return t("control_message.invite_user_text", {
      user: userCap,
      target_user,
    });
  } else if (message.userLeft) {
    return t("control_message.user_left_chat_text", { user: userCap });
  } else if (message.userMadeAdmin) {
    return t("control_message.admin_assignment_text", {
      user: userCap,
      target_user,
    });
  } else if (message.userRemovedAdmin) {
    return t("control_message.admin_removal_text", {
      user: userCap,
      target_user,
    });
  } else if (message.hostRequestStatusChanged) {
    const map = isCurrentUser
      ? requestStatusChangedMessageToSelfTransKey
      : requestStatusChangedMessageToTransKey;
    const transKey = map[message.hostRequestStatusChanged.status];
    if (transKey == null) {
      throw Error(t("control_message.unknown_message_text"));
    }
    return isCurrentUser ? t(transKey) : t(transKey, { user: userCap });
  } else {
    throw Error(t("control_message.unknown_message_text"));
  }
}

export function groupChatTitleText(
  groupChat: GroupChat.AsObject,
  groupChatMembersQuery: ReturnType<typeof useLiteUsers>,
  currentUserId: number,
  t: TFunction<"messages", undefined>,
) {
  return groupChat.title
    ? groupChat.title
    : groupChatMembersQuery.isLoading
      ? "Chat"
      : Array.from(groupChatMembersQuery.data?.values() ?? [])
          .filter((user) => user?.userId !== currentUserId)
          .map((user) => {
            const firstNameUser = firstName(user?.name);
            return firstNameUser === ""
              ? t("messages:unknown_user")
              : firstNameUser;
          })
          .join(", ");
}

/** Returns the other user's username, or null if there are more than 2 users. */
export function getDmUsername(
  groupChatMembersQuery: ReturnType<typeof useLiteUsers>,
  currentUserId: number,
) {
  const users = Array.from(groupChatMembersQuery.data?.values() ?? []);
  if (users.length === 2) {
    const username = users.find(
      (user) => user?.userId !== currentUserId,
    )?.username;
    return username ?? null;
  } else {
    return null;
  }
}
