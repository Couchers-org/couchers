import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import { observer } from "mobx-react-lite";
import * as React from "react";
import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import CircularProgress from "../../../components/CircularProgress";
import MessageList from "../messagelist/MessageList";
import {
  groupChatsState,
  leaveGroupChat,
  sendMessage,
  setGroupChat,
} from "./groupChatsSlice";

const useStyles = makeStyles({ root: {} });

export default observer(function GroupChatView() {
  const state = groupChatsState.groupChatView;
  const handleSend = (text: string) => sendMessage(state.groupChat!, text);

  const closeGroupChat = () => setGroupChat(null);

  const handleLeaveGroupChat = () => leaveGroupChat(state.groupChat!);

  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Typography variant="h3">{state.groupChat!.title}</Typography>
      <Button onClick={closeGroupChat}>
        <CloseIcon />
        (close)
      </Button>
      <Button onClick={handleLeaveGroupChat}>
        <CloseIcon />
        (leave)
      </Button>
      {state.error && <Alert severity="error">{state.error}</Alert>}
      {state.loading ? (
        <CircularProgress />
      ) : (
        <MessageList messages={state.messages} handleSend={handleSend} />
      )}
    </Box>
  );
});
