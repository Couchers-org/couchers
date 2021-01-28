import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { Error as GrpcError } from "grpc-web";
import { GroupChat, Message } from "../../../pb/conversations_pb";
import MessageList from "../messagelist/MessageList";
import { service } from "../../../service";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import GroupChatSendField from "./GroupChatSendField";
import { BackIcon, OverflowMenuIcon } from "../../../components/Icons";
import { groupChatTitleText } from "../utils";
import { useAuthContext } from "../../auth/AuthProvider";
import useUsers from "../../userQueries/useUsers";
import PageTitle from "../../../components/PageTitle";
import { useHistory, useParams } from "react-router-dom";
import { Skeleton } from "@material-ui/lab";
import HeaderButton from "../../../components/HeaderButton";
import Menu, { MenuItem } from "../../../components/Menu";
import InviteDialog from "./InviteDialog";
import LeaveDialog from "./LeaveDialog";
import MembersDialog from "./MembersDialog";
import GroupChatSettingsDialog from "./GroupChatSettingsDialog";

const useStyles = makeStyles((theme) => ({
  header: { display: "flex", alignItems: "center" },
  title: {
    flexGrow: 1,
    marginInline: theme.spacing(2),
  },
}));

export default function GroupChatView() {
  const classes = useStyles();

  const menuAnchor = useRef<HTMLAnchorElement>(null);
  const [isOpen, setIsOpen] = useState({
    menu: false,
    invite: false,
    members: false,
    settings: false,
    leave: false,
  });

  const handleClick = (what: keyof typeof isOpen) => {
    //close the menu if a menu item was selected
    if (what !== "menu") {
      setIsOpen({ ...isOpen, [what]: true, menu: false });
    } else {
      setIsOpen({ ...isOpen, [what]: true });
    }
  };

  const handleClose = (what: keyof typeof isOpen) => {
    setIsOpen({ ...isOpen, [what]: false });
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
    data: messages,
    isLoading: isMessagesLoading,
    error: messagesError,
  } = useQuery<Message.AsObject[], GrpcError>(
    ["groupChatMessages", groupChatId],
    () => service.conversations.getGroupChatMessages(groupChatId),
    { enabled: !!groupChatId }
  );

  const queryClient = useQueryClient();
  const sendMutation = useMutation<Empty, GrpcError, string>(
    (text: string) => service.conversations.sendMessage(groupChatId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["groupChatMessages", groupChatId]);
        queryClient.invalidateQueries(["groupChats"]);
      },
    }
  );

  const history = useHistory();

  const handleBack = () => history.goBack();
  return (
    <Box>
      {!groupChatId ? (
        <Alert severity="error">Invalid chat id.</Alert>
      ) : (
        <>
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
                    <MenuItem onClick={() => handleClick("settings")}>
                      Chat settings
                    </MenuItem>
                  )}
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
                  <GroupChatSettingsDialog
                    open={isOpen.settings}
                    onClose={() => handleClose("settings")}
                    groupChat={groupChat}
                  />
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
            messages && (
              <>
                <MessageList messages={messages} />
                <GroupChatSendField sendMutation={sendMutation} />
              </>
            )
          )}
        </>
      )}
    </Box>
  );
}
