import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { GroupChat, Message } from "proto/conversations_pb";
import { TFunction } from "react-i18next";
import { firstName } from "utils/names";

import { requestStatusToTransKey } from "./constants";

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
}: {
  user: string;
  target_user?: string;
  message: Message.AsObject;
  t: TFunction<"messages", undefined>;
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
    return t("control_message.host_request_status_changed_text", {
      user,
      status: t(
        requestStatusToTransKey[message.hostRequestStatusChanged.status]
      ),
    });
  } else {
    throw Error(t("control_message.unknown_message_text"));
  }
}

export function groupChatTitleText(
  groupChat: GroupChat.AsObject,
  groupChatMembersQuery: ReturnType<typeof useLiteUsers>,
  currentUserId: number
) {
  return groupChat.title
    ? groupChat.title
    : groupChatMembersQuery.isLoading
    ? "Chat"
    : Array.from(groupChatMembersQuery.data?.values() ?? [])
        .filter((user) => user?.userId !== currentUserId)
        .map((user) => firstName(user?.name))
        .join(", ");
}

/** Returns the other user's username, or null if there are more than 2 users. */
export function getDmUsername(
  groupChatMembersQuery: ReturnType<typeof useLiteUsers>,
  currentUserId: number
) {
  const users = Array.from(groupChatMembersQuery.data?.values() ?? []);
  if (users.length === 2) {
    const username = users.find(
      (user) => user?.userId !== currentUserId
    )?.username;
    return username ?? null;
  } else {
    return null;
  }
}
