import { Box, BoxProps, IconButton, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as React from "react";
import { useEffect, useState } from "react";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { GroupChat, Message } from "../../../pb/conversations_pb";
import { service } from "../../../service";
import MessageList from "../messagelist/MessageList";
import CloseIcon from "@material-ui/icons/Close";

const useStyles = makeStyles({ root: {} });

export interface GroupChatViewProps extends BoxProps {
  groupChat: GroupChat.AsObject;
  handleClose: () => void;
}

export default function GroupChatView({
  groupChat,
  handleClose,
}: GroupChatViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message.AsObject[]>([]);

  const handleSend = async (text: string) => {
    await service.conversations.sendMessage(groupChat.groupChatId, text);
    await fetchMessages();
  };

  async function fetchMessages() {
    try {
      const messages = await service.conversations.getGroupChatMessages(
        groupChat.groupChatId
      );
      setMessages(messages);
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchMessages();
    setLoading(false);
  }, [groupChat.groupChatId]);
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Typography variant={"h3"}>{groupChat.title}</Typography>
      <IconButton onClick={handleClose}>
        <CloseIcon />
      </IconButton>
      {error && <Alert severity={"error"}>{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        <MessageList messages={messages} handleSend={handleSend} />
      )}
    </Box>
  );
}
