import { hostRequestStatusLabels } from "features/messages/constants";
import useUsers from "features/userQueries/useUsers";
import { GroupChat, Message } from "proto/conversations_pb";
import { Link } from "react-router-dom";
import { routeToUser } from "routes";
import { firstName } from "utils/names";

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

export function controlMessageText(
  message: Message.AsObject,
  authorName: string,
  targetName?: string
) {
  const authorCap = authorName.charAt(0).toUpperCase() + authorName.slice(1);
  if (message.chatCreated) {
    return `${authorCap} created the chat`;
  } else if (message.chatEdited) {
    return `${authorCap} edited the chat`;
  } else if (message.userInvited) {
    return `${authorCap} invited ${targetName}`;
  } else if (message.userLeft) {
    return `${authorCap} left the chat`;
  } else if (message.userMadeAdmin) {
    return `${authorCap} made ${targetName} an admin`;
  } else if (message.userRemovedAdmin) {
    return `${authorCap} removed ${targetName} as admin`;
  } else if (message.hostRequestStatusChanged) {
    return `${authorCap} changed the request to ${
      hostRequestStatusLabels[message.hostRequestStatusChanged.status]
    }`;
  } else {
    throw Error("Unknown control message.");
  }
}

export function groupChatTitleText(
  groupChat: GroupChat.AsObject,
  groupChatMembersQuery: ReturnType<typeof useUsers>,
  currentUserId: number
) {


  if (groupChat.title) {
    return groupChat.title;
  } else if (groupChatMembersQuery.isLoading) {
    return "Chat";
  }

  return Array.from(groupChatMembersQuery.data?.values() ?? [])
    .filter((user) => user?.userId !== currentUserId)
    .map((user) => <Link to={routeToUser(user?.username || "")}>{firstName(user?.name)}</Link>)
    .reduce((arr: any[] | null, element: any) => arr === null ? [element] : [...arr, ', ', element], null);
  
}
