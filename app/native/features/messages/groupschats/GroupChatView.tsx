import { ThemedText } from "@/components/ThemedText";
import { GLOBAL, MESSAGES } from "@/i18n/namespaces";
import { useTranslation } from "@/i18n";
import { useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { service } from "@/service";
import { RpcError } from "grpc-web";
import { GetGroupChatMessagesRes, GroupChat } from "@/proto/conversations_pb";
import {
  groupChatKey,
  groupChatMessagesKey,
  groupChatsListKey,
} from "@/features/queryKeys";
import { GROUP_CHAT_REFETCH_INTERVAL } from "./constants";
import { useAuthContext } from "@/features/auth/AuthProvider";
import useUsers from "@/features/userQueries/useUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { MarkLastSeenVariables } from "../useMarkLastSeen";
import useMarkLastSeen from "../useMarkLastSeen";
import { useRouter } from "expo-router";
import { groupChatsRoute } from "@/routes";
import { getDmUsername, groupChatTitleText } from "../utils";
import { TouchableOpacity, View } from "react-native";
import Alert from "@/components/Alert";
import CircularProgress from "@/components/CircularProgress";
import HeaderButton from "@/components/HeaderButton";
import InfiniteMessageLoader from "../messagelist/InfiniteMessageLoader";
import MessageList from "../messagelist/MessageList";
import GroupChatSendField from "./GroupChatSendField";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    height: "100%",
  },
  messageFieldContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "white",
  },
});

export default function GroupChatView({ chatId }: { chatId: number }) {
  const { t } = useTranslation([GLOBAL, MESSAGES]);

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

  const currentUserId = useAuthContext().authState.userId!;
  const isChatAdmin = groupChat?.adminUserIdsList.includes(currentUserId);
  const groupChatMembersQuery = useUsers(groupChat?.memberUserIdsList ?? []);

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

  if (!chatId) {
    return <Alert>{t("messages:chat_view.invalid_id_error")}</Alert>;
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <HeaderButton
          onPress={handleBack}
          aria-label={t("messages:chat_view.back_button.a11y_label")}
        >
          <ThemedText>⬅️</ThemedText>
        </HeaderButton>

        {groupChat?.isDm ? (
          <View>
            <TouchableOpacity
              onPress={() => {
                router.push(
                  `/user/${getDmUsername(groupChatMembersQuery, currentUserId)}`
                );
              }}
            >
              <ThemedText>{title}</ThemedText>
            </TouchableOpacity>
            {unmuteMutation.isLoading ? (
              <CircularProgress />
            ) : (
              groupChat?.muteInfo?.muted && (
                <ThemedText>
                  {t("messages:chat_view.muted_icon.a11y_label")}
                </ThemedText>
              )
            )}
          </View>
        ) : (
          <View>
            <ThemedText>{title}</ThemedText>
            {groupChat?.muteInfo?.muted && (
              <ThemedText>
                {t("messages:chat_view.muted_icon.a11y_label")}
              </ThemedText>
            )}
          </View>
        )}
      </View>
      {isMessagesLoading ? (
        <CircularProgress />
      ) : (
        messagesRes && (
          <>
            <InfiniteMessageLoader
              earliestMessageId={
                messagesRes.pages[messagesRes.pages.length - 1].lastMessageId
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
            <View style={styles.messageFieldContainer}>
              <GroupChatSendField
                sendMutation={sendMutation}
                chatId={chatId}
                currentUserId={currentUserId}
              />
            </View>
          </>
        )
      )}
    </View>
  );
  // return (
  //   <>
  //     <HtmlMeta title={title} />
  //     {!chatId ? (
  //       <Alert severity="error">
  //         {t("messages:chat_view.invalid_id_error")}
  //       </Alert>
  //     ) : (
  //       <div className={classes.pageWrapper}>
  //         <div className={classes.header}>
  //           <HeaderButton
  //             onClick={handleBack}
  //             aria-label={t("messages:chat_view.back_button.a11y_label")}
  //           >
  //             <BackIcon />
  //           </HeaderButton>

  //           {groupChat?.isDm ? (
  //             <div className={classes.title}>
  //               <Link
  //                 href={`/user/${getDmUsername(
  //                   groupChatMembersQuery,
  //                   currentUserId
  //                 )}`}
  //               >
  //                 <a>
  //                   <PageTitle>{title || <Skeleton width={100} />}</PageTitle>
  //                 </a>
  //               </Link>
  //               {unmuteMutation.isLoading ? (
  //                 <CircularProgress size="1.5rem" />
  //               ) : (
  //                 groupChat?.muteInfo?.muted && (
  //                   <MuteIcon
  //                     data-testid="mute-icon"
  //                     titleAccess={t(
  //                       "messages:chat_view.muted_icon.a11y_label"
  //                     )}
  //                   />
  //                 )
  //               )}
  //             </div>
  //           ) : (
  //             <div className={classes.title}>
  //               <PageTitle>{title || <Skeleton width={100} />}</PageTitle>
  //               {groupChat?.muteInfo?.muted && (
  //                 <MuteIcon
  //                   data-testid="mute-icon"
  //                   titleAccess={t("messages:chat_view.muted_icon.a11y_label")}
  //                 />
  //               )}
  //             </div>
  //           )}

  //           <>
  //             <HeaderButton
  //               onClick={() => handleClick("menu")}
  //               aria-label={t("messages:chat_view.actions_menu.a11y_label")}
  //               aria-haspopup="true"
  //               aria-controls="more-menu"
  //               innerRef={menuAnchor}
  //             >
  //               <OverflowMenuIcon />
  //             </HeaderButton>
  //             <Menu
  //               id="more-menu"
  //               anchorEl={menuAnchor.current}
  //               keepMounted
  //               open={isOpen.menu}
  //               onClose={() => handleClose("menu")}
  //             >
  //               {[
  //                 groupChat ? (
  //                   <MenuItem onClick={() => handleClick("mute")} key="mute">
  //                     {!groupChat.muteInfo?.muted
  //                       ? t("messages:chat_view.mute.button_label")
  //                       : t("messages:chat_view.mute.unmute_button_label")}
  //                   </MenuItem>
  //                 ) : null,
  //                 !groupChat?.isDm
  //                   ? [
  //                       !groupChat?.onlyAdminsInvite || isChatAdmin ? (
  //                         <MenuItem
  //                           onClick={() => handleClick("invite")}
  //                           key="invite"
  //                         >
  //                           {t(
  //                             "messages:chat_view.actions_menu.items.invite_members"
  //                           )}
  //                         </MenuItem>
  //                       ) : null,
  //                       <MenuItem
  //                         onClick={() => handleClick("members")}
  //                         key="members"
  //                       >
  //                         {t(
  //                           "messages:chat_view.actions_menu.items.show_all_members"
  //                         )}
  //                       </MenuItem>,
  //                       isChatAdmin
  //                         ? [
  //                             <MenuItem
  //                               onClick={() => handleClick("admins")}
  //                               key="admins"
  //                             >
  //                               {t(
  //                                 "messages:chat_view.actions_menu.items.manage_admins"
  //                               )}
  //                             </MenuItem>,
  //                             <MenuItem
  //                               onClick={() => handleClick("settings")}
  //                               key="settings"
  //                             >
  //                               {t(
  //                                 "messages:chat_view.actions_menu.items.chat_settings"
  //                               )}
  //                             </MenuItem>,
  //                           ]
  //                         : null,

  //                       groupChat?.memberUserIdsList.includes(currentUserId) ? (
  //                         <MenuItem
  //                           onClick={() => handleClick("leave")}
  //                           key="leave"
  //                         >
  //                           {t(
  //                             "messages:chat_view.actions_menu.items.leave_chat"
  //                           )}
  //                         </MenuItem>
  //                       ) : null,
  //                     ]
  //                   : null,
  //               ]}
  //             </Menu>
  //             {groupChat && (
  //               <>
  //                 <MuteDialog
  //                   open={isOpen.mute}
  //                   onClose={() => handleClose("mute")}
  //                   groupChatId={chatId}
  //                 />
  //                 <InviteDialog
  //                   open={isOpen.invite}
  //                   onClose={() => handleClose("invite")}
  //                   groupChat={groupChat}
  //                 />
  //                 <MembersDialog
  //                   open={isOpen.members}
  //                   onClose={() => handleClose("members")}
  //                   groupChat={groupChat}
  //                 />
  //                 <AdminsDialog
  //                   open={isOpen.admins}
  //                   onClose={() => handleClose("admins")}
  //                   groupChat={groupChat}
  //                 />
  //                 <GroupChatSettingsDialog
  //                   open={isOpen.settings}
  //                   onClose={() => handleClose("settings")}
  //                   groupChat={groupChat}
  //                 />
  //               </>
  //             )}
  //             <LeaveDialog
  //               open={isOpen.leave}
  //               onClose={() => handleClose("leave")}
  //               groupChatId={chatId}
  //             />
  //           </>
  //         </div>
  //         {(groupChatError || messagesError || sendMutation.error) && (
  //           <Alert severity="error">
  //             {groupChatError?.message ||
  //               messagesError?.message ||
  //               sendMutation.error?.message ||
  //               t("global:error.fallback.title")}
  //           </Alert>
  //         )}
  //         {isMessagesLoading ? (
  //           <CircularProgress />
  //         ) : (
  //           messagesRes && (
  //             <>
  //               <InfiniteMessageLoader
  //                 earliestMessageId={
  //                   messagesRes.pages[messagesRes.pages.length - 1]
  //                     .lastMessageId
  //                 }
  //                 latestMessage={messagesRes.pages[0].messagesList[0]}
  //                 fetchNextPage={fetchNextPage}
  //                 isFetchingNextPage={isFetchingNextPage}
  //                 hasNextPage={!!hasNextPage}
  //                 isError={!!messagesError}
  //               >
  //                 <MessageList
  //                   markLastSeen={markLastSeen}
  //                   messages={messagesRes.pages
  //                     .map((page) => page.messagesList)
  //                     .flat()}
  //                 />
  //               </InfiniteMessageLoader>
  //               <div className={classes.footer}>
  //                 <GroupChatSendField
  //                   sendMutation={sendMutation}
  //                   chatId={chatId}
  //                   currentUserId={currentUserId}
  //                 />
  //               </div>
  //             </>
  //           )
  //         )}
  //       </div>
  //     )}
  //   </>
  // );
}
