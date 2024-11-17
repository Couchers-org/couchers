import { useMediaQuery } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon, MuteIcon, OverflowMenuIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import PageTitle from "components/PageTitle";
import { useAuthContext } from "features/auth/AuthProvider";
import AdminsDialog from "features/messages/groupchats/AdminsDialog";
import GroupChatSendField from "features/messages/groupchats/GroupChatSendField";
import GroupChatSettingsDialog from "features/messages/groupchats/GroupChatSettingsDialog";
import InviteDialog from "features/messages/groupchats/InviteDialog";
import LeaveDialog from "features/messages/groupchats/LeaveDialog";
import MembersDialog from "features/messages/groupchats/MembersDialog";
import MuteDialog from "features/messages/groupchats/MuteDialog";
import InfiniteMessageLoader from "features/messages/messagelist/InfiniteMessageLoader";
import MessageList from "features/messages/messagelist/MessageList";
import useMarkLastSeen, {
  MarkLastSeenVariables,
} from "features/messages/useMarkLastSeen";
import { getDmUsername, groupChatTitleText } from "features/messages/utils";
import {
  groupChatKey,
  groupChatMessagesKey,
  groupChatsListKey,
} from "features/queryKeys";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { GetGroupChatMessagesRes, GroupChat } from "proto/conversations_pb";
import { useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { groupChatsRoute } from "routes";
import { service } from "service";
import { theme } from "theme";

import { GROUP_CHAT_REFETCH_INTERVAL } from "./constants";

export const useGroupChatViewStyles = makeStyles((theme) => ({
  footer: {
    marginTop: "auto",
    flexGrow: 0,
    paddingBottom: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),

    [theme.breakpoints.down("sm")]: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    },
  },
  header: {
    padding: theme.spacing(1, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    alignItems: "center",
    display: "flex",
    flexGrow: 0,
    "& > * + *": {
      marginInlineStart: theme.spacing(2),
    },

    [theme.breakpoints.down("sm")]: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    },
  },
  messageLoader: {
    padding: theme.spacing(2, 2),

    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1, 1),
    },
  },
  pageWrapper: {
    [theme.breakpoints.up("sm")]: {
      height: `calc(100vh - ${theme.shape.navPaddingSmUp})`,
    },
    [theme.breakpoints.down("sm")]: {
      height: `calc(100vh - ${theme.shape.navPaddingXs})`,
    },
    alignItems: "stretch",
    display: "flex",
    flexDirection: "column",
    // 56px = address bar height on mobile - https://dev.to/peiche/100vh-behavior-on-chrome-2hm8
    height: `calc(100vh - ${theme.shape.navPaddingXs} - 56px - 80px)`,
  },
  title: {
    flexGrow: 1,
    width: "100%",
    display: "flex",
    alignItems: "center",
    marginInlineEnd: theme.spacing(2),
    marginInlineStart: theme.spacing(2),
    "& > *": { marginInlineEnd: theme.spacing(2) },

    [theme.breakpoints.down("sm")]: {
      fontSize: "0.9rem",
    },
  },
  requestedDatesWrapper: {
    display: "flex",
    "& > *": {
      margin: 0,
    },
  },
  numNights: {
    fontWeight: "initial",
  },
  requestedDates: {
    paddingRight: theme.spacing(1),
  },
  loadingBox: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(2),
    width: "100%",
  },
}));

export default function GroupChatView({ chatId }: { chatId: number }) {
  const { t } = useTranslation([GLOBAL, MESSAGES]);
  const classes = useGroupChatViewStyles();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const menuAnchor = useRef<HTMLAnchorElement>(null);
  const [isOpen, setIsOpen] = useState({
    admins: false,
    invite: false,
    leave: false,
    members: false,
    menu: false,
    mute: false,
    settings: false,
  });

  const queryClient = useQueryClient();

  const { data: groupChat, error: groupChatError } = useQuery<
    GroupChat.AsObject,
    RpcError
  >(groupChatKey(chatId), () => service.conversations.getGroupChat(chatId), {
    enabled: !!chatId,
    refetchInterval: GROUP_CHAT_REFETCH_INTERVAL,
  });

  const unmuteMutation = useMutation<void, RpcError>(
    async () => {
      await service.conversations.muteChat({
        groupChatId: chatId,
        unmute: true,
      });
    },
    {
      onSuccess() {
        queryClient.setQueryData(groupChatKey(chatId), {
          ...groupChat,
          muteInfo: { muted: false },
        });
        queryClient.invalidateQueries(groupChatKey(chatId));
      },
    }
  );

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

  //for title text
  const currentUserId = useAuthContext().authState.userId!;
  const isChatAdmin = groupChat?.adminUserIdsList.includes(currentUserId);
  const groupChatMembersQuery = useLiteUsers(
    groupChat?.memberUserIdsList ?? []
  );

  const {
    data: messagesRes,
    isLoading: isMessagesLoading,
    error: messagesError,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery<GetGroupChatMessagesRes.AsObject, RpcError>(
    groupChatMessagesKey(chatId),
    ({ pageParam: lastMessageId }) =>
      service.conversations.getGroupChatMessages(chatId, lastMessageId),
    {
      enabled: !!chatId,
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastMessageId,
      refetchInterval: GROUP_CHAT_REFETCH_INTERVAL,
    }
  );

  const sendMutation = useMutation<Empty, RpcError, string>(
    (text) => service.conversations.sendMessage(chatId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(groupChatMessagesKey(chatId));
        queryClient.invalidateQueries([groupChatsListKey]);
        queryClient.invalidateQueries(groupChatKey(chatId));
      },
    }
  );

  const { mutate: markLastSeenGroupChat } = useMutation<
    Empty,
    RpcError,
    MarkLastSeenVariables
  >(
    (messageId) =>
      service.conversations.markLastSeenGroupChat(chatId, messageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(groupChatKey(chatId));
      },
    }
  );
  const { markLastSeen } = useMarkLastSeen(
    markLastSeenGroupChat,
    groupChat?.lastSeenMessageId
  );

  const router = useRouter();

  const handleBack = () => router.push(groupChatsRoute);

  const title = groupChat
    ? groupChatTitleText(groupChat, groupChatMembersQuery, currentUserId)
    : undefined;

  return (
    <>
      <HtmlMeta title={title} />
      {!chatId ? (
        <Alert severity="error">
          {t("messages:chat_view.invalid_id_error")}
        </Alert>
      ) : (
        <div className={classes.pageWrapper}>
          <div className={classes.header}>
            <HeaderButton
              onClick={handleBack}
              aria-label={t("messages:chat_view.back_button.a11y_label")}
            >
              <BackIcon fontSize={isMobile ? "small" : "default"} />
            </HeaderButton>

            {groupChat?.isDm ? (
              <div className={classes.title}>
                <Link
                  href={`/user/${getDmUsername(
                    groupChatMembersQuery,
                    currentUserId
                  )}`}
                >
                  <a>
                    <PageTitle>{title || <Skeleton width={100} />}</PageTitle>
                  </a>
                </Link>
                {unmuteMutation.isLoading ? (
                  <CircularProgress size="1.5rem" />
                ) : (
                  groupChat?.muteInfo?.muted && (
                    <MuteIcon
                      data-testid="mute-icon"
                      titleAccess={t(
                        "messages:chat_view.muted_icon.a11y_label"
                      )}
                    />
                  )
                )}
              </div>
            ) : (
              <div className={classes.title}>
                <PageTitle>{title || <Skeleton width={100} />}</PageTitle>
                {groupChat?.muteInfo?.muted && (
                  <MuteIcon
                    data-testid="mute-icon"
                    titleAccess={t("messages:chat_view.muted_icon.a11y_label")}
                  />
                )}
              </div>
            )}

            <>
              <HeaderButton
                onClick={() => handleClick("menu")}
                aria-label={t("messages:chat_view.actions_menu.a11y_label")}
                aria-haspopup="true"
                aria-controls="more-menu"
                innerRef={menuAnchor}
              >
                <OverflowMenuIcon fontSize={isMobile ? "small" : "default"} />
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
                      {!groupChat.muteInfo?.muted
                        ? t("messages:chat_view.mute.button_label")
                        : t("messages:chat_view.mute.unmute_button_label")}
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
                              "messages:chat_view.actions_menu.items.invite_members"
                            )}
                          </MenuItem>
                        ) : null,
                        <MenuItem
                          onClick={() => handleClick("members")}
                          key="members"
                        >
                          {t(
                            "messages:chat_view.actions_menu.items.show_all_members"
                          )}
                        </MenuItem>,
                        isChatAdmin
                          ? [
                              <MenuItem
                                onClick={() => handleClick("admins")}
                                key="admins"
                              >
                                {t(
                                  "messages:chat_view.actions_menu.items.manage_admins"
                                )}
                              </MenuItem>,
                              <MenuItem
                                onClick={() => handleClick("settings")}
                                key="settings"
                              >
                                {t(
                                  "messages:chat_view.actions_menu.items.chat_settings"
                                )}
                              </MenuItem>,
                            ]
                          : null,

                        groupChat?.memberUserIdsList.includes(currentUserId) ? (
                          <MenuItem
                            onClick={() => handleClick("leave")}
                            key="leave"
                          >
                            {t(
                              "messages:chat_view.actions_menu.items.leave_chat"
                            )}
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
          </div>
          {(groupChatError || messagesError || sendMutation.error) && (
            <Alert severity="error">
              {groupChatError?.message ||
                messagesError?.message ||
                sendMutation.error?.message ||
                t("global:error.fallback.title")}
            </Alert>
          )}
          {isMessagesLoading ? (
            <div className={classes.loadingBox}>
              <CircularProgress />
            </div>
          ) : (
            messagesRes && (
              <>
                <InfiniteMessageLoader
                  className={classes.messageLoader}
                  earliestMessageId={
                    messagesRes.pages[messagesRes.pages.length - 1]
                      .lastMessageId
                  }
                  latestMessage={messagesRes.pages[0].messagesList[0]}
                  fetchNextPage={fetchNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={!!hasNextPage}
                  isError={!!messagesError}
                >
                  <MessageList
                    markLastSeen={markLastSeen}
                    messages={messagesRes.pages
                      .map((page) => page.messagesList)
                      .flat()}
                  />
                </InfiniteMessageLoader>
                <div className={classes.footer}>
                  <GroupChatSendField
                    sendMutation={sendMutation}
                    chatId={chatId}
                    currentUserId={currentUserId}
                  />
                </div>
              </>
            )
          )}
        </div>
      )}
    </>
  );
}
