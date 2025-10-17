import { GroupChat, Message } from "@couchers/services/conversations";
import { TFunction } from "i18next";

import { useLiteUsers } from "@/features/userQueries/useLiteUsers";
import { firstName } from "@/utils/names";

import { requestStatusToTransKey } from "./constants";

export const isControlMessage = (message: Message.AsObject) => {
  return !message.text;
};

export const messageTargetId = (message: Message.AsObject) => {
  return message.userInvited
    ? message.userInvited.targetUserId
    : message.userMadeAdmin
      ? message.userMadeAdmin.targetUserId
      : message.userRemovedAdmin
        ? message.userRemovedAdmin.targetUserId
        : undefined;
};

export const controlMessage = ({
  user,
  targetUser,
  message,
  t,
}: {
  user: string;
  targetUser?: string;
  message: Message.AsObject;
  t: TFunction<"messages">;
}) => {
  const userCap = user.charAt(0).toUpperCase() + user.slice(1);
  if (message.chatCreated) {
    return t("control_message.created_chat_text", { user: userCap });
  } else if (message.chatEdited) {
    return t("control_message.edited_chat_text", { user: userCap });
  } else if (message.userInvited) {
    return t("control_message.invite_user_text", {
      user: userCap,
      targetUser,
    });
  } else if (message.userLeft) {
    return t("control_message.user_left_chat_text", { user: userCap });
  } else if (message.userMadeAdmin) {
    return t("control_message.admin_assignment_text", {
      user: userCap,
      targetUser,
    });
  } else if (message.userRemovedAdmin) {
    return t("control_message.admin_removal_text", {
      user: userCap,
      targetUser,
    });
  } else if (message.hostRequestStatusChanged) {
    return t("control_message.host_request_status_changed_text", {
      user,
      status: t(
        requestStatusToTransKey[message.hostRequestStatusChanged.status],
      ),
    });
  } else {
    throw Error(t("control_message.unknown_message_text"));
  }
};

export const groupChatTitleText = (
  groupChat: GroupChat.AsObject,
  groupChatMembersQuery: ReturnType<typeof useLiteUsers>,
  currentUserId: number,
  t: TFunction<"messages">,
) => {
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
};

/** Returns the other user's username, or null if there are more than 2 users. */
export const getDmUsername = (
  groupChatMembersQuery: ReturnType<typeof useLiteUsers>,
  currentUserId: number,
) => {
  const users = Array.from(groupChatMembersQuery.data?.values() ?? []);
  if (users.length === 2) {
    const username = users.find(
      (user) => user?.userId !== currentUserId,
    )?.username;
    return username ?? null;
  } else {
    return null;
  }
};
