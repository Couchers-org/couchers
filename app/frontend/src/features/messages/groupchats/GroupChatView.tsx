import { Box, IconButton, Menu, MenuItem, Typography } from "@material-ui/core";
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
import SendField from "../SendField";
import { BackIcon, SettingsIcon } from "../../../components/Icons";
import { groupChatTitleText } from "../utils";
import { useAuthContext } from "../../auth/AuthProvider";
import useUsers from "../../userQueries/useUsers";
import PageTitle from "../../../components/PageTitle";

const useStyles = makeStyles({
  root: {},
  header: { display: "flex", alignItems: "center" },
  title: {
    flexGrow: 1,
  },
});

interface GroupChatViewProps {
  groupChat: GroupChat.AsObject;
  closeGroupChat: () => void;
}

export default function GroupChatView({
  groupChat,
  closeGroupChat,
}: GroupChatViewProps) {
  const classes = useStyles();

  const menuAnchor = useRef<HTMLAnchorElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = () => {
    setMenuOpen(true);
  };

  const handleClose = () => {
    setMenuOpen(false);
  };

  //for title text
  const currentUserId = useAuthContext().authState.userId!;
  const groupChatMembersQuery = useUsers(groupChat.memberUserIdsList);

  const { data: messages, isLoading, error } = useQuery<
    Message.AsObject[],
    GrpcError
  >(["groupChatMessages", groupChat.groupChatId], () =>
    service.conversations.getGroupChatMessages(groupChat.groupChatId)
  );

  const queryClient = useQueryClient();
  const sendMutation = useMutation<Empty, GrpcError, string>(
    (text: string) =>
      service.conversations.sendMessage(groupChat.groupChatId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          "groupChatMessages",
          groupChat.groupChatId,
        ]);
        queryClient.invalidateQueries(["groupChats"]);
      },
    }
  );

  const leaveGroupChatMutation = useMutation<Empty, GrpcError, void>(
    () => service.conversations.leaveGroupChat(groupChat.groupChatId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          "groupChatMessages",
          groupChat.groupChatId,
        ]);
        queryClient.invalidateQueries(["groupChats"]);
      },
    }
  );

  const handleLeaveGroupChat = () => leaveGroupChatMutation.mutate();
  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <IconButton onClick={closeGroupChat} aria-label="Back">
          <BackIcon />
        </IconButton>

        <PageTitle className={classes.title}>
          {groupChatTitleText(groupChat, groupChatMembersQuery, currentUserId)}
        </PageTitle>

        <IconButton
          onClick={handleClick}
          aria-label="Menu"
          aria-haspopup="true"
          innerRef={menuAnchor}
        >
          <SettingsIcon />
        </IconButton>
        <Menu
          id="simple-menu"
          anchorEl={menuAnchor.current}
          keepMounted
          open={menuOpen}
          onClose={handleClose}
        >
          <MenuItem onClick={handleLeaveGroupChat}>Leave chat</MenuItem>
        </Menu>
      </Box>
      {(error || sendMutation.error || leaveGroupChatMutation.error) && (
        <Alert severity="error">
          {error ||
            sendMutation.error?.message ||
            leaveGroupChatMutation.error?.message}
        </Alert>
      )}
      {isLoading ? (
        <CircularProgress />
      ) : (
        messages && (
          <>
            <MessageList messages={messages} />
            <SendField sendMutation={sendMutation} />
          </>
        )
      )}
    </Box>
  );
}
