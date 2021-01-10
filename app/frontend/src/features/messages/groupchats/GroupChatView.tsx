import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import * as React from "react";
import { leaveGroupChat, sendMessage, setGroupChat } from ".";
import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import CircularProgress from "../../../components/CircularProgress";
import { useAppDispatch, useTypedSelector } from "../../../store";
import MessageList from "../messagelist/MessageList";

const useStyles = makeStyles({ root: {} });

export default function GroupChatView() {
  const dispatch = useAppDispatch();
  const { error, loading, groupChat, messages } = useTypedSelector((state) => {
    return state.groupChats.groupChatView;
  });

  const handleSend = (text: string) =>
    dispatch(sendMessage({ groupChat: groupChat!, text }));

  const closeGroupChat = () => dispatch(setGroupChat(null));

  const handleLeaveGroupChat = () => dispatch(leaveGroupChat(groupChat!));

  const classes = useStyles();
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
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <CircularProgress /> : <MessageList messages={messages} />}
    </Box>
  );
}
