import {
  ArchiveOutlined,
  NotificationsActive,
  NotificationsOff,
  UnarchiveOutlined,
} from "@mui/icons-material";
import { Skeleton, styled } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CircularProgress from "components/CircularProgress";
import HeaderButton from "components/HeaderButton";
import { BackIcon, MuteIcon, OverflowMenuIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import PageTitle from "components/PageTitle";
import AdminsDialog from "features/messages/groupchats/AdminsDialog";
import GroupChatSettingsDialog from "features/messages/groupchats/GroupChatSettingsDialog";
import InviteDialog from "features/messages/groupchats/InviteDialog";
import LeaveDialog from "features/messages/groupchats/LeaveDialog";
import MembersDialog from "features/messages/groupchats/MembersDialog";
import MuteDialog from "features/messages/groupchats/MuteDialog";
import { getDmUsername } from "features/messages/utils";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { GroupChat } from "proto/conversations_pb";
import { useRef, useState } from "react";
import { groupChatsRoute, messagesRoute, routeToUser } from "routes";
import { service } from "service";
import { theme } from "theme";
import useIsScreenSmallerThan from "utils/useIsScreenSmallerThan";

import { groupChatKey, groupChatsListKey } from "../../queryKeys";

const StyledTitleBox = styled("div")({
  flexGrow: 1,
  width: "100%",
  display: "flex",
  alignItems: "center",
  marginInlineEnd: theme.spacing(2),
  marginInlineStart: theme.spacing(2),
  "& > *": { marginInlineEnd: theme.spacing(2) },
});

export default function GroupChatHeaderBar({
  chatId,
  currentUserId,
  groupChat,
  groupChatMembersQuery,
  title,
}: {
  chatId: number;
  currentUserId: number;
  groupChat: GroupChat.AsObject | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groupChatMembersQuery: any;
  title: string | undefined;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation([GLOBAL, MESSAGES]);
  const username = getDmUsername(groupChatMembersQuery, currentUserId);

  const isChatAdmin = groupChat?.adminUserIdsList.includes(currentUserId);

  // TODO #5227 - decide on consistent usage of breakpoints
  const isMobile = useIsScreenSmallerThan("SMALL_MOBILE");

  const menuAnchor = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState({
    admins: false,
    invite: false,
    leave: false,
    members: false,
    menu: false,
    mute: false,
    settings: false,
  });

  const unmuteMutation = useMutation<void, RpcError>({
    mutationFn: async () => {
      await service.conversations.muteChat({
        groupChatId: chatId,
        unmute: true,
      });
    },

    onSuccess() {
      queryClient.setQueryData(groupChatKey(chatId), {
        ...groupChat,
        muteInfo: { muted: false },
      });
      queryClient.invalidateQueries({ queryKey: groupChatKey(chatId) });
    },
  });

  const archiveMutation = useMutation<void, RpcError>({
    mutationFn: async () => {
      await service.conversations.setGroupChatArchiveStatus(
        chatId,
        !groupChat?.isArchived,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [groupChatsListKey()] });
      queryClient.invalidateQueries({ queryKey: groupChatKey(chatId) });
      router.push(messagesRoute);
    },
  });

  const handleBack = () => router.push(groupChatsRoute);

  const handleClick = (item: keyof typeof isOpen) => {
    //just unmute straight away with no dialog if muted
    if (item === "mute" && groupChat?.muteInfo?.muted) {
      unmuteMutation.mutate();
      setIsOpen((prev) => ({ ...prev, menu: false }));
      return;
    }

    //close the menu if a menu item was selected
    if (item !== "menu") {
      setIsOpen((prev) => ({ ...prev, [item]: true, menu: false }));
    } else {
      setIsOpen((prev) => ({ ...prev, [item]: true }));
    }
  };

  const handleClose = (item: keyof typeof isOpen) => {
    setIsOpen({ ...isOpen, [item]: false });
  };

  return (
    <>
      <HeaderButton
        onClick={handleBack}
        aria-label={t("messages:chat_view.back_button.a11y_label")}
        size={isMobile ? "small" : "medium"}
      >
        <BackIcon fontSize={isMobile ? "small" : "medium"} />
      </HeaderButton>
      {groupChat?.isDm ? (
        <StyledTitleBox>
          <Link href={username ? routeToUser(username) : ""}>
            <PageTitle
              sx={{
                [theme.breakpoints.down("sm")]: {
                  fontSize: "0.9rem",
                },
              }}
            >
              {title || <Skeleton width={100} />}
            </PageTitle>
          </Link>
          {unmuteMutation.isPending ? (
            <CircularProgress size="1.5rem" />
          ) : (
            groupChat?.muteInfo?.muted && (
              <MuteIcon
                data-testid="mute-icon"
                titleAccess={t("messages:chat_view.muted_icon.a11y_label")}
                fontSize={isMobile ? "small" : "large"}
              />
            )
          )}
        </StyledTitleBox>
      ) : (
        <StyledTitleBox>
          <PageTitle
            sx={{
              [theme.breakpoints.down("sm")]: {
                fontSize: "0.9rem",
              },
            }}
          >
            {title || <Skeleton width={100} />}
          </PageTitle>
          {groupChat?.muteInfo?.muted && (
            <MuteIcon
              data-testid="mute-icon"
              titleAccess={t("messages:chat_view.muted_icon.a11y_label")}
              fontSize={isMobile ? "small" : "medium"}
            />
          )}
        </StyledTitleBox>
      )}
      <>
        <HeaderButton
          onClick={() => handleClick("menu")}
          aria-label={t("messages:chat_view.actions_menu.a11y_label")}
          aria-haspopup="true"
          aria-controls="more-menu"
          ref={menuAnchor}
          size={isMobile ? "small" : "medium"}
        >
          <OverflowMenuIcon sx={{ fontSize: isMobile ? "small" : "medium" }} />
        </HeaderButton>
        <Menu
          id="more-menu"
          anchorEl={menuAnchor.current}
          keepMounted
          open={isOpen.menu}
          onClose={() => handleClose("menu")}
        >
          {[
            groupChat ? (
              <MenuItem onClick={() => handleClick("mute")} key="mute">
                {!groupChat.muteInfo?.muted ? (
                  <>
                    <NotificationsOff fontSize="small" sx={{ mr: 1 }} />
                    {t("messages:chat_view.mute.button_label")}
                  </>
                ) : (
                  <>
                    <NotificationsActive fontSize="small" sx={{ mr: 1 }} />
                    {t("messages:chat_view.mute.unmute_button_label")}
                  </>
                )}
              </MenuItem>
            ) : null,
            groupChat ? (
              <MenuItem
                onClick={() => archiveMutation.mutate()}
                key="archive"
                disabled={archiveMutation.isPending}
              >
                {groupChat.isArchived ? (
                  <>
                    <UnarchiveOutlined fontSize="small" sx={{ mr: 1 }} />
                    {t("messages:archive.unarchive_button")}
                  </>
                ) : (
                  <>
                    <ArchiveOutlined fontSize="small" sx={{ mr: 1 }} />
                    {t("messages:archive.archive_button")}
                  </>
                )}
              </MenuItem>
            ) : null,
            !groupChat?.isDm
              ? [
                  !groupChat?.onlyAdminsInvite || isChatAdmin ? (
                    <MenuItem
                      onClick={() => handleClick("invite")}
                      key="invite"
                    >
                      {t(
                        "messages:chat_view.actions_menu.items.invite_members",
                      )}
                    </MenuItem>
                  ) : null,
                  <MenuItem
                    onClick={() => handleClick("members")}
                    key="members"
                  >
                    {t(
                      "messages:chat_view.actions_menu.items.show_all_members",
                    )}
                  </MenuItem>,
                  isChatAdmin
                    ? [
                        <MenuItem
                          onClick={() => handleClick("admins")}
                          key="admins"
                        >
                          {t(
                            "messages:chat_view.actions_menu.items.manage_admins",
                          )}
                        </MenuItem>,
                        <MenuItem
                          onClick={() => handleClick("settings")}
                          key="settings"
                        >
                          {t(
                            "messages:chat_view.actions_menu.items.chat_settings",
                          )}
                        </MenuItem>,
                      ]
                    : null,

                  groupChat?.memberUserIdsList.includes(currentUserId) ? (
                    <MenuItem onClick={() => handleClick("leave")} key="leave">
                      {t("messages:chat_view.actions_menu.items.leave_chat")}
                    </MenuItem>
                  ) : null,
                ]
              : null,
          ]}
        </Menu>
        {groupChat && (
          <>
            <MuteDialog
              open={isOpen.mute}
              onClose={() => handleClose("mute")}
              groupChatId={chatId}
            />
            <InviteDialog
              open={isOpen.invite}
              onClose={() => handleClose("invite")}
              groupChat={groupChat}
            />
            <MembersDialog
              open={isOpen.members}
              onClose={() => handleClose("members")}
              groupChat={groupChat}
            />
            <AdminsDialog
              open={isOpen.admins}
              onClose={() => handleClose("admins")}
              groupChat={groupChat}
            />
            <GroupChatSettingsDialog
              open={isOpen.settings}
              onClose={() => handleClose("settings")}
              groupChat={groupChat}
            />
          </>
        )}
        <LeaveDialog
          open={isOpen.leave}
          onClose={() => handleClose("leave")}
          groupChatId={chatId}
        />
      </>
    </>
  );
}
