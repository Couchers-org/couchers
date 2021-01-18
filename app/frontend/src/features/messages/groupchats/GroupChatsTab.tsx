import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { useQuery } from "react-query";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { Error as GrpcError } from "grpc-web";
import { GroupChat } from "../../../pb/conversations_pb";
import CreateGroupChat from "./CreateGroupChat";
import GroupChatList from "./GroupChatList";
import { service } from "../../../service";

const useStyles = makeStyles({ root: {} });

export default function GroupChatsTab() {
  const classes = useStyles();

  /// TODO: Pagination
  const { data: groupChats, isLoading, error } = useQuery<
    GroupChat.AsObject[],
    GrpcError
  >(["groupChats"], () => service.conversations.listGroupChats());

  return (
    <Box className={classes.root}>
      {error && <Alert severity={"error"}>{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : (
        groupChats && (
          <>
            <CreateGroupChat />
            <GroupChatList groupChats={groupChats} />
          </>
        )
      )}
    </Box>
  );
}
