import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { useState } from "react";
import { useQuery } from "react-query";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { Error as GrpcError } from "grpc-web";
import { GroupChat } from "../../../pb/conversations_pb";
import CreateGroupChat from "./CreateGroupChat";
import GroupChatList from "./GroupChatList";
import GroupChatView from "./GroupChatView";
import { service } from "../../../service";

const useStyles = makeStyles({ root: {} });

export default function GroupChatsTab() {
  const classes = useStyles();

  ///TODO: add url chat opening

  const [groupChat, setGroupChat] = useState<GroupChat.AsObject | null>(null);

  /// TODO: Pagination
  const { data: groupChats, isLoading, error } = useQuery<
    GroupChat.AsObject[],
    GrpcError
  >(["groupChats"], () => service.conversations.listGroupChats());

  const closeGroupChat = () => setGroupChat(null);

  return (
    <Box className={classes.root}>
      {error && <Alert severity={"error"}>{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : groupChat ? (
        <GroupChatView groupChat={groupChat} closeGroupChat={closeGroupChat} />
      ) : (
        <>
          <GroupChatList groupChats={groupChats!} setGroupChat={setGroupChat} />
          <CreateGroupChat />
        </>
      )}
    </Box>
  );
}
