import { ArchiveOutlined, UnarchiveOutlined } from "@mui/icons-material";
import {
  ListItemAvatar,
  ListItemButton,
  ListItemProps,
  ListItemText,
  Skeleton,
  styled,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Avatar from "components/Avatar";
import EllipsisMenu, { EllipsisMenuItem } from "components/EllipsisMenu";
import { MuteIcon } from "components/Icons";
import { useAuthContext } from "features/auth/AuthProvider";
import {
  controlMessage,
  groupChatTitleText,
  isControlMessage,
  messageTargetId,
} from "features/messages/utils";
import { groupChatsListKey } from "features/queryKeys";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { GroupChat } from "proto/conversations_pb";
import React, { useState } from "react";
import { service } from "service";
import { theme } from "theme";
import { firstName } from "utils/names";

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

const StyledListItemContainer = styled("div")(() => ({
  position: "relative",
  width: "100%",
}));

const StyledMenuContainer = styled("div")(() => ({
  position: "absolute",
  bottom: theme.spacing(1),
  right: theme.spacing(1),
  zIndex: 1,
}));

interface GroupChatListItemProps extends ListItemProps {
  groupChat: GroupChat.AsObject;
  isArchived?: boolean;
}

export default function GroupChatListItem({
  groupChat,
  className,
  isArchived = false,
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

  const queryClient = useQueryClient();

  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(
    null
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const archiveMutation = useMutation<void, RpcError>({
    mutationFn: async () => {
      await service.conversations.setGroupChatArchiveStatus(
        groupChat.groupChatId,
        !isArchived
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [groupChatsListKey()] });
    },
  });

  const menuItems: EllipsisMenuItem[] = [
    {
      icon: isArchived ? UnarchiveOutlined : ArchiveOutlined,
      label: isArchived
        ? t("archive.unarchive_button")
        : t("archive.archive_button"),
      onClick: () => archiveMutation.mutate(),
    },
  ];

  return (
    <StyledListItemContainer>
      <ListItemButton className={className} sx={{ paddingRight: 7 }}>
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
      <StyledMenuContainer>
        <EllipsisMenu
          idName={`group-chat-${groupChat.groupChatId}`}
          isMenuOpen={!!menuAnchorEl}
          menuAnchorEl={menuAnchorEl}
          onMenuOpen={handleMenuOpen}
          onMenuClose={handleMenuClose}
          items={menuItems}
        />
      </StyledMenuContainer>
    </StyledListItemContainer>
  );
}
