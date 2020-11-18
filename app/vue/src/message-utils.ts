import moment from "moment"

import { Message } from "./pb/conversations_pb"
import { protobufTimestampToDate, displayHostRequestStatus } from "./utils"
import { User } from "./pb/api_pb"

export type UserCache = { [userId: number]: User.AsObject }

export function isMyMessage(message: Message.AsObject, userId: number) {
  return message.authorUserId === userId
}

export function isControlMessage(message: Message.AsObject) {
  return !message.text
}

export function getName(userId: number, userCache: UserCache) {
  const user = userCache[userId]
  if (!user) {
    return "error"
  }
  return user.name.split(" ")[0]
}

export function messageAuthor(message: Message.AsObject, userCache: UserCache) {
  return getName(message.authorUserId, userCache)
}

export function controlMessageText(
  message: Message.AsObject,
  userId: number,
  userCache: UserCache
) {
  const author =
    message.authorUserId === userId ? "You" : messageAuthor(message, userCache)
  if (message.chatCreated !== undefined) {
    return `${author} created the chat`
  } else if (message.chatEdited !== undefined) {
    return `${author} edited the chat`
  } else if (message.userInvited !== undefined) {
    const target = getName(message.userInvited.targetUserId, userCache)
    return `${author} invited ${target}`
  } else if (message.userLeft !== undefined) {
    return `${author} left the chat`
  } else if (message.userMadeAdmin !== undefined) {
    const target = getName(message.userMadeAdmin.targetUserId, userCache)
    return `${author} made ${target} an admin`
  } else if (message.userRemovedAdmin !== undefined) {
    const target = getName(message.userRemovedAdmin.targetUserId, userCache)
    return `${author} removed ${target} as admin`
  } else if (message.hostRequestStatusChanged !== undefined) {
    const status = displayHostRequestStatus(
      message.hostRequestStatusChanged.status
    )
    return `${author} changed the request to ${status}`
  } else {
    throw Error("Unknown control message.")
  }
}

export function messageText(
  message: Message.AsObject,
  userId: number,
  userCache: UserCache
) {
  if (isControlMessage(message)) {
    return controlMessageText(message, userId, userCache)
  } else if (message.text) {
    return message.text.text
  } else {
    throw Error("Unknown message type")
  }
}

export function initialsFromName(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
}

export function messageDisplayTime(message: Message.AsObject) {
  const date = protobufTimestampToDate(message.time!)
  if (new Date().getTime() - date.getTime() > 120 * 60 * 1000) {
    // longer than 2h ago, display as absolute
    return moment(date).format("lll")
  } else {
    // relative
    return moment(date).fromNow()
  }
}

export function messageColor(message: Message.AsObject, userCache: UserCache) {
  const user = userCache[message.authorUserId]
  if (!user) {
    return "red"
  }
  return user.color
}

export function messageAvatarText(
  message: Message.AsObject,
  userCache: UserCache
) {
  const user = userCache[message.authorUserId]
  if (!user) {
    return "ERR"
  }
  return initialsFromName(user.name)
}
