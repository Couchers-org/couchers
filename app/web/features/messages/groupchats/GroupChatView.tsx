import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon, OverflowMenuIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import PageTitle from "components/PageTitle";
import { useAuthContext } from "features/auth/AuthProvider";
import AdminsDialog from "features/messages/groupchats/AdminsDialog";
import GroupChatSendField from "features/messages/groupchats/GroupChatSendField";
import GroupChatSettingsDialog from "features/messages/groupchats/GroupChatSettingsDialog";
import InviteDialog from "features/messages/groupchats/InviteDialog";
import LeaveDialog from "features/messages/groupchats/LeaveDialog";
import MembersDialog from "features/messages/groupchats/MembersDialog";
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
import useUsers from "features/userQueries/useUsers";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
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

import { ERROR_UNKNOWN } from "../constants";
import { GROUP_CHAT_REFETCH_INTERVAL } from "./constants";

export const useGroupChatViewStyles = makeStyles((theme) => ({
  footer: {
    marginTop: "auto",
    flexGrow: 0,
    paddingBottom: theme.spacing(2),
  },
  header: {
    paddingTop: theme.spacing(1),
    alignItems: "center",
    display: "flex",
    flexGrow: 0,
    "& > * + *": {
      marginInlineStart: theme.spacing(2),
    },
  },
  pageWrapper: {
    [theme.breakpoints.up("sm")]: {
      height: `calc(100vh - ${theme.shape.navPaddingSmUp})`,
    },
    alignItems: "stretch",
    display: "flex",
    flexDirection: "column",
    height: `calc(100vh - ${theme.shape.navPaddingXs})`,
  },
  title: {
    flexGrow: 1,
    width: "100%",
    marginInlineEnd: theme.spacing(2),
    marginInlineStart: theme.spacing(2),
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
}));

export default function GroupChatView({ chatId }: { chatId: number }) {
  const classes = useGroupChatViewStyles();

  const menuAnchor = useRef<HTMLAnchorElement>(null);
  const [isOpen, setIsOpen] = useState({
    admins: false,
    invite: false,
    leave: false,
    members: false,
    menu: false,
    settings: false,
  });

  const handleClick = (item: keyof typeof isOpen) => {
    //close the menu if a menu item was selected
    if (item !== "menu") {
      setIsOpen({ ...isOpen, [item]: true, menu: false });
    } else {
      setIsOpen({ ...isOpen, [item]: true });
    }
  };

  const handleClose = (item: keyof typeof isOpen) => {
    setIsOpen({ ...isOpen, [item]: false });
  };

  const { data: groupChat, error: groupChatError } = useQuery<
    GroupChat.AsObject,
    RpcError
  >(groupChatKey(chatId), () => service.conversations.getGroupChat(chatId), {
    enabled: !!chatId,
    refetchInterval: GROUP_CHAT_REFETCH_INTERVAL,
  });

  //for title text
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

  const queryClient = useQueryClient();
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
    <div>
      <HtmlMeta title={title} />
      {!chatId ? (
        <Alert severity="error">Invalid chat id.</Alert>
      ) : (
        <div className={classes.pageWrapper}>
          <div className={classes.header}>
            <HeaderButton onClick={handleBack} aria-label="Back">
              <BackIcon />
            </HeaderButton>

            {groupChat?.isDm ? (
              <Link
                href={`/user/${getDmUsername(
                  groupChatMembersQuery,
                  currentUserId
                )}`}
              >
                <a>
                  <PageTitle className={classes.title}>
                    {title || <Skeleton width={100} />}
                  </PageTitle>
                </a>
              </Link>
            ) : (
              <PageTitle className={classes.title}>
                {title || <Skeleton width={100} />}
              </PageTitle>
            )}

            {!groupChat?.isDm && (
              <>
                <HeaderButton
                  onClick={() => handleClick("menu")}
                  aria-label="Menu"
                  aria-haspopup="true"
                  aria-controls="more-menu"
                  innerRef={menuAnchor}
                >
                  <OverflowMenuIcon />
                </HeaderButton>
                <Menu
                  id="more-menu"
                  anchorEl={menuAnchor.current}
                  keepMounted
                  open={isOpen.menu}
                  onClose={() => handleClose("menu")}
                >
                  {(!groupChat?.onlyAdminsInvite || isChatAdmin) && (
                    <MenuItem onClick={() => handleClick("invite")}>
                      Invite to chat
                    </MenuItem>
                  )}
                  <MenuItem onClick={() => handleClick("members")}>
                    Chat members
                  </MenuItem>
                  {isChatAdmin && (
                    <MenuItem onClick={() => handleClick("admins")}>
                      Manage chat admins
                    </MenuItem>
                  )}

                  {
                    //<Menu> gives console warning for JSX Fragment children
                    isChatAdmin && (
                      <MenuItem onClick={() => handleClick("settings")}>
                        Chat settings
                      </MenuItem>
                    )
                  }
                  {groupChat?.memberUserIdsList.includes(currentUserId) && (
                    <MenuItem onClick={() => handleClick("leave")}>
                      Leave chat
                    </MenuItem>
                  )}
                </Menu>
                {groupChat && (
                  <>
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
            )}
          </div>
          {(groupChatError || messagesError || sendMutation.error) && (
            <Alert severity="error">
              {groupChatError?.message ||
                messagesError?.message ||
                sendMutation.error?.message ||
                ERROR_UNKNOWN}
            </Alert>
          )}
          {isMessagesLoading ? (
            <CircularProgress />
          ) : (
            messagesRes && (
              <>
                <InfiniteMessageLoader
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
                  <GroupChatSendField sendMutation={sendMutation} />
                </div>
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
