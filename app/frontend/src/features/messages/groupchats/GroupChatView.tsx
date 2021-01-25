import { Box, Menu, MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useHistory, useParams } from "react-router-dom";

import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import HeaderButton from "../../../components/HeaderButton";
import { BackIcon, OverflowMenuIcon } from "../../../components/Icons";
import PageTitle from "../../../components/PageTitle";
import { GroupChat, Message } from "../../../pb/conversations_pb";
import { service } from "../../../service";
import { useAuthContext } from "../../auth/AuthProvider";
import useUsers from "../../userQueries/useUsers";
import MessageList from "../messagelist/MessageList";
import { groupChatTitleText } from "../utils";
import GroupChatSendField from "./GroupChatSendField";

const useStyles = makeStyles((theme) => ({
  header: { display: "flex", alignItems: "center" },
  title: {
    flexGrow: 1,
    marginInline: theme.spacing(2),
  },
  menuItem: {
    paddingInline: theme.spacing(2),
  },
}));

export default function GroupChatView() {
  const classes = useStyles();

  const menuAnchor = useRef<HTMLAnchorElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = () => {
    setMenuOpen(true);
  };

  const handleClose = () => {
    setMenuOpen(false);
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

  const leaveGroupChatMutation = useMutation<Empty, GrpcError, void>(
    () => service.conversations.leaveGroupChat(groupChatId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["groupChatMessages", groupChatId]);
        queryClient.invalidateQueries(["groupChats"]);
      },
    }
  );

  const history = useHistory();

  const handleLeaveGroupChat = () => leaveGroupChatMutation.mutate();
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

            <HeaderButton
              onClick={handleClick}
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
              open={menuOpen}
              onClose={handleClose}
            >
              <MenuItem
                onClick={handleLeaveGroupChat}
                className={classes.menuItem}
              >
                Leave chat
              </MenuItem>
            </Menu>
          </Box>
          {(groupChatError ||
            messagesError ||
            sendMutation.error ||
            leaveGroupChatMutation.error) && (
            <Alert severity="error">
              {groupChatError?.message ||
                messagesError?.message ||
                sendMutation.error?.message ||
                leaveGroupChatMutation.error?.message}
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
