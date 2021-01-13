import { Message } from "../../pb/conversations_pb";
import { hostRequestStatusLabels } from "./constants";

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
  } else if (message.chatEdited !== undefined) {
    return `${authorCap} edited the chat`;
  } else if (message.userInvited !== undefined) {
    return `${authorCap} invited ${targetName}`;
  } else if (message.userLeft !== undefined) {
    return `${authorCap} left the chat`;
  } else if (message.userMadeAdmin !== undefined) {
    return `${authorCap} made ${targetName} an admin`;
  } else if (message.userRemovedAdmin !== undefined) {
    return `${authorCap} removed ${targetName} as admin`;
  } else if (message.hostRequestStatusChanged !== undefined) {
    return `${authorCap} changed the request to ${
      hostRequestStatusLabels[message.hostRequestStatusChanged.status]
    }`;
  } else {
    throw Error("Unknown control message.");
  }
}
