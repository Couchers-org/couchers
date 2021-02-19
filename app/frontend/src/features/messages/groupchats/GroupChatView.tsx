import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import React, { useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { useHistory, useParams } from "react-router-dom";

import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import HeaderButton from "../../../components/HeaderButton";
import { BackIcon, OverflowMenuIcon } from "../../../components/Icons";
import Menu, { MenuItem } from "../../../components/Menu";
import PageTitle from "../../../components/PageTitle";
import {
  GetGroupChatMessagesRes,
  GroupChat,
} from "../../../pb/conversations_pb";
import { service } from "../../../service";
import { useAuthContext } from "../../auth/AuthProvider";
import useUsers from "../../userQueries/useUsers";
import InfiniteMessageLoader from "../messagelist/InfiniteMessageLoader";
import MessageList from "../messagelist/MessageList";
import useMarkLastSeen, { MarkLastSeenVariables } from "../useMarkLastSeen";
import { groupChatTitleText } from "../utils";
import AdminsDialog from "./AdminsDialog";
import GroupChatSendField from "./GroupChatSendField";
import GroupChatSettingsDialog from "./GroupChatSettingsDialog";
import InviteDialog from "./InviteDialog";
import LeaveDialog from "./LeaveDialog";
import MembersDialog from "./MembersDialog";

export const useGroupChatViewStyles = makeStyles((theme) => ({
  pageWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    height: `calc(100vh - ${theme.shape.navPaddingMobile})`,
    [theme.breakpoints.up("md")]: {
      height: `calc(100vh - ${theme.shape.navPaddingDesktop})`,
    },
  },
  header: { display: "flex", alignItems: "center", flexGrow: 0 },
  footer: { flexGrow: 0, paddingBottom: theme.spacing(2) },
  title: {
    flexGrow: 1,
    marginInlineStart: theme.spacing(2),
    marginInlineEnd: theme.spacing(2),
  },
  messageList: {
    paddingBlock: theme.spacing(2),
  },
}));

export default function GroupChatView() {
  const classes = useGroupChatViewStyles();

  const menuAnchor = useRef<HTMLAnchorElement>(null);
  const [isOpen, setIsOpen] = useState({
    menu: false,
    invite: false,
    members: false,
    admins: false,
    settings: false,
    leave: false,
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
    ["groupChat", groupChatId],
    () => service.conversations.getGroupChat(groupChatId),
    { enabled: !!groupChatId }
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
    ["groupChatMessages", groupChatId],
    ({ pageParam: lastMessageId }) =>
      service.conversations.getGroupChatMessages(groupChatId, lastMessageId),
    {
      enabled: !!groupChatId,
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastMessageId,
    }
  );

  const queryClient = useQueryClient();
  const sendMutation = useMutation<Empty, GrpcError, string>(
    (text) => service.conversations.sendMessage(groupChatId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["groupChatMessages", groupChatId]);
        queryClient.invalidateQueries(["groupChats"]);
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
        queryClient.invalidateQueries(["groupChat", groupChatId]);
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
    <Box>
      {!groupChatId ? (
        <Alert severity="error">Invalid chat id.</Alert>
      ) : (
        <Box className={classes.pageWrapper}>
          <Box className={classes.header}>
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
          </Box>
          {(groupChatError || messagesError || sendMutation.error) && (
            <Alert severity="error">
              {groupChatError?.message ||
                messagesError?.message ||
                sendMutation.error?.message}
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
                  fetchNextPage={fetchNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={!!hasNextPage}
                  isError={!!messagesError}
                  className={classes.messageList}
                >
                  <MessageList
                    markLastSeen={markLastSeen}
                    messages={messagesRes.pages
                      .map((page) => page.messagesList)
                      .flat()}
                  />
                </InfiniteMessageLoader>
                <Box className={classes.footer}>
                  <GroupChatSendField sendMutation={sendMutation} />
                </Box>
              </>
            )
          )}
        </Box>
      )}
    </Box>
  );
}
