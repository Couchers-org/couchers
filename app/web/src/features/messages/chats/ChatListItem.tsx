import {
  ListItem,
  ListItemAvatar,
  ListItemProps,
  ListItemText,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import Avatar from "components/Avatar";
import { useAuthContext } from "features/auth/AuthProvider";
import {
  controlMessageText,
  chatTitleText,
  isControlMessage,
  messageTargetId,
} from "features/messages/utils";
import useUsers from "features/userQueries/useUsers";
import { Chat } from "proto/conversations_pb";
import React from "react";
import { firstName } from "utils/names";

const useStyles = makeStyles({ root: {}, unread: { fontWeight: "bold" } });

export interface ChatListItemProps extends ListItemProps {
  chat: Chat.AsObject;
}

export default function ChatListItem({ chat, className }: ChatListItemProps) {
  const classes = useStyles();
  const currentUserId = useAuthContext().authState.userId!;
  const latestMessageAuthorId = chat.latestMessage?.authorUserId;
  const isUnreadClass =
    chat.lastSeenMessageId !== chat.latestMessage?.messageId
      ? classes.unread
      : "";

  //It is possible the last message is sent by someone who has left
  //so include it just in case
  const chatMembersQuery = useUsers([
    ...chat.memberUserIdsList,
    latestMessageAuthorId,
  ]);

  //the avatar is of the latest message author (if it's not the logged in user),
  //otherwise any user that's not the logged in user, otherwise logged in user
  const avatarUserId =
    latestMessageAuthorId !== null && latestMessageAuthorId !== currentUserId
      ? latestMessageAuthorId
      : chat.memberUserIdsList.find((id) => id !== currentUserId) ??
        currentUserId;
  //title is the chat title, or all the member's names except current user joined together
  const title = chatTitleText(chat, chatMembersQuery, currentUserId);
  //text is the control message text or message text
  let text = "";
  const authorName = firstName(
    chatMembersQuery.data?.get(chat.latestMessage?.authorUserId)?.name
  );
  if (chat.latestMessage && isControlMessage(chat.latestMessage)) {
    const targetName = firstName(
      chatMembersQuery.data?.get(messageTargetId(chat.latestMessage))?.name
    );
    text = controlMessageText(chat.latestMessage, authorName, targetName);
  } else {
    text = `${authorName}: ${chat.latestMessage?.text?.text || ""}`;
  }

  return (
    <ListItem button className={classNames(classes.root, className)}>
      <ListItemAvatar>
        {chatMembersQuery.isLoading ? (
          <Skeleton />
        ) : (
          <Avatar
            user={chatMembersQuery.data?.get(avatarUserId)}
            isProfileLink={false}
          />
        )}
      </ListItemAvatar>
      {
        //When we want more than primary and secondary (host Request status, etc)
        //They can also take react nodes. But change typography component using props
      }
      <ListItemText
        primary={chatMembersQuery.isLoading ? <Skeleton /> : title}
        secondary={chatMembersQuery.isLoading ? <Skeleton /> : text}
        primaryTypographyProps={{ noWrap: true, className: isUnreadClass }}
        secondaryTypographyProps={{ noWrap: true, className: isUnreadClass }}
      />
    </ListItem>
  );
}
