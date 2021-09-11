import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HeaderButton from "components/HeaderButton";
import { BackIcon, OverflowMenuIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import PageTitle from "components/PageTitle";
import { useAuthContext } from "features/auth/AuthProvider";
import AdminsDialog from "features/messages/chats/AdminsDialog";
import ChatSendField from "features/messages/chats/ChatSendField";
import ChatSettingsDialog from "features/messages/chats/ChatSettingsDialog";
import InviteDialog from "features/messages/chats/InviteDialog";
import LeaveDialog from "features/messages/chats/LeaveDialog";
import MembersDialog from "features/messages/chats/MembersDialog";
import InfiniteMessageLoader from "features/messages/messagelist/InfiniteMessageLoader";
import MessageList from "features/messages/messagelist/MessageList";
import useMarkLastSeen, {
  MarkLastSeenVariables,
} from "features/messages/useMarkLastSeen";
import { chatTitleText } from "features/messages/utils";
import useUsers from "features/userQueries/useUsers";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { GetChatMessagesRes, Chat } from "proto/conversations_pb";
import { chatKey, chatMessagesKey, chatsListKey } from "queryKeys";
import { useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { service } from "service";

import { CHAT_REFETCH_INTERVAL } from "./constants";

export const useChatViewStyles = makeStyles((theme) => ({
  footer: {
    marginTop: "auto",
    flexGrow: 0,
    paddingBottom: theme.spacing(2),
  },
  header: {
    alignItems: "center",
    display: "flex",
    flexGrow: 0,
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

export default function ChatView() {
  const classes = useChatViewStyles();

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

  const chatId = +(useParams<{ chatId?: string }>().chatId || 0);

  const { data: chat, error: chatError } = useQuery<Chat.AsObject, GrpcError>(
    chatKey(chatId),
    () => service.conversations.getChat(chatId),
    { enabled: !!chatId, refetchInterval: CHAT_REFETCH_INTERVAL }
  );

  //for title text
  const currentUserId = useAuthContext().authState.userId!;
  const isChatAdmin = chat?.adminUserIdsList.includes(currentUserId);
  const chatMembersQuery = useUsers(chat?.memberUserIdsList ?? []);

  const {
    data: messagesRes,
    isLoading: isMessagesLoading,
    error: messagesError,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery<GetChatMessagesRes.AsObject, GrpcError>(
    chatMessagesKey(chatId),
    ({ pageParam: lastMessageId }) =>
      service.conversations.getChatMessages(chatId, lastMessageId),
    {
      enabled: !!chatId,
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastMessageId,
      refetchInterval: CHAT_REFETCH_INTERVAL,
    }
  );

  const queryClient = useQueryClient();
  const sendMutation = useMutation<Empty, GrpcError, string>(
    (text) => service.conversations.sendMessage(chatId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(chatMessagesKey(chatId));
        queryClient.invalidateQueries([chatsListKey]);
        queryClient.invalidateQueries(chatKey(chatId));
      },
    }
  );

  const { mutate: markLastSeenChat } = useMutation<
    Empty,
    GrpcError,
    MarkLastSeenVariables
  >((messageId) => service.conversations.markLastSeenChat(chatId, messageId), {
    onSuccess: () => {
      queryClient.invalidateQueries(chatKey(chatId));
    },
  });
  const { markLastSeen } = useMarkLastSeen(
    markLastSeenChat,
    chat?.lastSeenMessageId
  );

  const history = useHistory();

  const handleBack = () => history.goBack();

  return (
    <div>
      {!chatId ? (
        <Alert severity="error">Invalid chat id.</Alert>
      ) : (
        <div className={classes.pageWrapper}>
          <div className={classes.header}>
            <HeaderButton onClick={handleBack} aria-label="Back">
              <BackIcon />
            </HeaderButton>

            <PageTitle className={classes.title}>
              {chat ? (
                chatTitleText(chat, chatMembersQuery, currentUserId)
              ) : chatError ? (
                "Error"
              ) : (
                <Skeleton width={100} />
              )}
            </PageTitle>

            {!chat?.isDm && (
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
                  {(!chat?.onlyAdminsInvite || isChatAdmin) && (
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
                  {chat?.memberUserIdsList.includes(currentUserId) && (
                    <MenuItem onClick={() => handleClick("leave")}>
                      Leave chat
                    </MenuItem>
                  )}
                </Menu>
                {chat && (
                  <>
                    <InviteDialog
                      open={isOpen.invite}
                      onClose={() => handleClose("invite")}
                      chat={chat}
                    />
                    <MembersDialog
                      open={isOpen.members}
                      onClose={() => handleClose("members")}
                      chat={chat}
                    />
                    <AdminsDialog
                      open={isOpen.admins}
                      onClose={() => handleClose("admins")}
                      chat={chat}
                    />
                    <ChatSettingsDialog
                      open={isOpen.settings}
                      onClose={() => handleClose("settings")}
                      chat={chat}
                    />
                  </>
                )}
                <LeaveDialog
                  open={isOpen.leave}
                  onClose={() => handleClose("leave")}
                  chatId={chatId}
                />
              </>
            )}
          </div>
          {(chatError || messagesError || sendMutation.error) && (
            <Alert severity="error">
              {chatError?.message ||
                messagesError?.message ||
                sendMutation.error?.message ||
                ""}
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
                  <ChatSendField sendMutation={sendMutation} />
                </div>
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
