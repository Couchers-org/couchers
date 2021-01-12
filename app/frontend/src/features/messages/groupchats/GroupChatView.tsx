import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import CircularProgress from "../../../components/CircularProgress";
import { Error as GrpcError } from "grpc-web";
import { GroupChat, Message } from "../../../pb/conversations_pb";
import MessageList from "../messagelist/MessageList";
import { service } from "../../../service";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import SendField from "../SendField";

const useStyles = makeStyles({ root: {} });

interface GroupChatViewProps {
  groupChat: GroupChat.AsObject;
  closeGroupChat: () => void;
}

export default function GroupChatView({
  groupChat,
  closeGroupChat,
}: GroupChatViewProps) {
  const classes = useStyles();

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
      <Typography variant="h3">{groupChat!.title}</Typography>
      <Button onClick={closeGroupChat}>
        <CloseIcon />
        (close)
      </Button>
      <Button onClick={handleLeaveGroupChat}>
        <CloseIcon />
        (leave)
      </Button>
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
        <>
          <MessageList messages={messages!} />
          <SendField mutation={sendMutation} />
        </>
      )}
    </Box>
  );
}
