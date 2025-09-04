import {
  ListItemAvatar,
  ListItemButton,
  ListItemProps,
  ListItemText,
  Skeleton,
  Typography,
  styled,
} from "@mui/material";
import React from "react";

import Avatar from "@/components/Avatar";
import { MuteIcon } from "@/components/Icons";
import { useAuthContext } from "@/features/auth/AuthProvider";
import {
  controlMessage,
  groupChatTitleText,
  isControlMessage,
  messageTargetId,
} from "@/features/messages/utils";
import { useLiteUsers } from "@/features/userQueries/useLiteUsers";
import { useTranslation } from "@/i18n";
import { MESSAGES } from "@/i18n/namespaces";
import { GroupChat } from "@/proto/conversations_pb";
import { theme } from "@/theme";
import { firstName } from "@/utils/names";

const StyledListItemTypography = styled(Typography, {
  shouldForwardProp: (propName) => propName !== "isUnread",
})<{ isUnread: boolean }>(({ isUnread }) => ({
  fontWeight: isUnread ? "bold" : "inherit",
}));

const StyledMuteIcon = styled(MuteIcon)(() => ({
  verticalAlign: "middle",
}));

const StyledTitle = styled("span")(() => ({
  marginInlineEnd: theme.spacing(1),
}));

export interface GroupChatListItemProps extends ListItemProps {
  groupChat: GroupChat.AsObject;
}

export default function GroupChatListItem({
  groupChat,
  className,
}: GroupChatListItemProps) {
  const { t } = useTranslation(MESSAGES);
  const currentUserId = useAuthContext().authState.userId!;
  const latestMessageAuthorId = groupChat.latestMessage?.authorUserId;

  const isUnread =
    groupChat.lastSeenMessageId !== groupChat.latestMessage?.messageId;

  //It is possible the last message is sent by someone who has left
  //so include it just in case
  const groupChatMembersQuery = useLiteUsers([
    ...groupChat.memberUserIdsList,
    latestMessageAuthorId,
  ]);

  //the avatar is of the latest message author (if it's not the logged in user),
  //otherwise any user that's not the logged in user, otherwise logged in user
  const avatarUserId =
    latestMessageAuthorId !== null && latestMessageAuthorId !== currentUserId
      ? latestMessageAuthorId
      : (groupChat.memberUserIdsList.find((id) => id !== currentUserId) ??
        currentUserId);
  //title is the chat title, or all the member's names except current user joined together
  const title = groupChatTitleText(
    groupChat,
    groupChatMembersQuery,
    currentUserId,
    t,
  );
  //text is the control message text or message text
  let text = "";
  const authorName = firstName(
    groupChatMembersQuery.data?.get(groupChat.latestMessage?.authorUserId)
      ?.name,
  );
  if (groupChat.latestMessage && isControlMessage(groupChat.latestMessage)) {
    const targetName = firstName(
      groupChatMembersQuery.data?.get(messageTargetId(groupChat.latestMessage))
        ?.name,
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
    <ListItemButton className={className}>
      <ListItemAvatar>
        {groupChatMembersQuery.isLoading ? (
          <Skeleton />
        ) : (
          <Avatar
            user={groupChatMembersQuery.data?.get(avatarUserId)}
            isProfileLink={false}
          />
        )}
      </ListItemAvatar>
      <ListItemText
        slotProps={{
          primary: { component: "span" },
          secondary: { component: "span" },
        }}
        primary={
          <StyledListItemTypography isUnread={isUnread} noWrap>
            {groupChatMembersQuery.isLoading ? (
              <Skeleton />
            ) : (
              <>
                <StyledTitle>{title}</StyledTitle>
                {groupChat.muteInfo?.muted && <StyledMuteIcon />}
              </>
            )}
          </StyledListItemTypography>
        }
        secondary={
          <StyledListItemTypography isUnread={isUnread} noWrap>
            {groupChatMembersQuery.isLoading ? <Skeleton /> : text}
          </StyledListItemTypography>
        }
      />
    </ListItemButton>
  );
}
