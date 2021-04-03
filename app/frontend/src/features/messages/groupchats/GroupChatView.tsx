import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HeaderButton from "components/HeaderButton";
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
import { groupChatTitleText } from "features/messages/utils";
import useUsers from "features/userQueries/useUsers";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { GetGroupChatMessagesRes, GroupChat } from "pb/conversations_pb";
import {
  groupChatBaseKey,
  groupChatKey,
  groupChatMessagesKey,
} from "queryKeys";
import { useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { service } from "service";

import { GROUP_CHAT_REFETCH_INTERVAL } from "./constants";

export const useGroupChatViewStyles = makeStyles((theme) => ({
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
    [theme.breakpoints.up("md")]: {
      height: `calc(100vh - ${theme.shape.navPaddingDesktop})`,
    },
    alignItems: "stretch",
    display: "flex",
    flexDirection: "column",
    height: `calc(100vh - ${theme.shape.navPaddingMobile})`,
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

export default function GroupChatView() {
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

  const groupChatId = +(useParams<{ groupChatId?: string }>().groupChatId || 0);

  const { data: groupChat, error: groupChatError } = useQuery<
    GroupChat.AsObject,
    GrpcError
  >(
    groupChatKey(groupChatId),
    () => service.conversations.getGroupChat(groupChatId),
    { enabled: !!groupChatId, refetchInterval: GROUP_CHAT_REFETCH_INTERVAL }
  );

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
  } = useInfiniteQuery<GetGroupChatMessagesRes.AsObject, GrpcError>(
    groupChatMessagesKey(groupChatId),
    ({ pageParam: lastMessageId }) =>
      service.conversations.getGroupChatMessages(groupChatId, lastMessageId),
    {
      enabled: !!groupChatId,
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastMessageId,
      refetchInterval: GROUP_CHAT_REFETCH_INTERVAL,
    }
  );

  const queryClient = useQueryClient();
  const sendMutation = useMutation<Empty, GrpcError, string>(
    (text) => service.conversations.sendMessage(groupChatId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(groupChatMessagesKey(groupChatId));
        queryClient.invalidateQueries([groupChatBaseKey]);
      },
    }
  );

  const { mutate: markLastSeenGroupChat } = useMutation<
    Empty,
    GrpcError,
    MarkLastSeenVariables
  >(
    (messageId) =>
      service.conversations.markLastSeenGroupChat(groupChatId, messageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(groupChatKey(groupChatId));
      },
    }
  );
  const { markLastSeen } = useMarkLastSeen(
    markLastSeenGroupChat,
    groupChat?.lastSeenMessageId
  );

  const history = useHistory();

  const handleBack = () => history.goBack();

  return (
    <div>
      {!groupChatId ? (
        <Alert severity="error">Invalid chat id.</Alert>
      ) : (
        <div className={classes.pageWrapper}>
          <div className={classes.header}>
            <HeaderButton onClick={handleBack} aria-label="Back">
              <BackIcon />
            </HeaderButton>

            <PageTitle className={classes.title}>
              {groupChat ? (
                groupChatTitleText(
                  groupChat,
                  groupChatMembersQuery,
                  currentUserId
                )
              ) : groupChatError ? (
                "Error"
              ) : (
                <Skeleton width={100} />
              )}
            </PageTitle>

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
                {groupChat && (
                  <>
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
                  groupChatId={groupChatId}
                />
              </>
            )}
          </div>
          {(groupChatError || messagesError || sendMutation.error) && (
            <Alert severity="error">
              {groupChatError?.message ||
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
