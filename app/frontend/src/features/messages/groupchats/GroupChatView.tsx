import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import * as React from "react";
import { useEffect } from "react";
import {
  fetchMessagesThunk,
  leaveGroupChatThunk,
  sendMessageThunk,
  setGroupChat,
} from ".";
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
    // if (componentState.groupChat) {
    //   return { ...componentState, groupChat: componentState.groupChat };
    // } else {
    //   throw new Error("No groupChat");
    // }
  });

  const handleSend = (text: string) =>
    dispatch(sendMessageThunk({ groupChat: groupChat!, text }));

  const closeGroupChat = () => dispatch(setGroupChat(null));

  const leaveGroupChat = () => dispatch(leaveGroupChatThunk(groupChat!));

  useEffect(() => void dispatch(fetchMessagesThunk(groupChat!)), []);

  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Typography variant="h3">{groupChat!.title}</Typography>
      <Button onClick={closeGroupChat}>
        <CloseIcon />
        (close)
      </Button>
      <Button onClick={leaveGroupChat}>
        <CloseIcon />
        (leave)
      </Button>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        <MessageList messages={messages} handleSend={handleSend} />
      )}
    </Box>
  );
}
