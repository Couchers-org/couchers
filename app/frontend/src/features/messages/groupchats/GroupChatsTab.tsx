import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import CreateGroupChat from "./CreateGroupChat";
import GroupChatList from "./GroupChatList";
import { fetchGroupChats, groupChatsState } from "./groupChatsSlice";
import GroupChatView from "./GroupChatView";

const useStyles = makeStyles({ root: {} });

export default observer(function GroupChatsTab() {
  const state = groupChatsState;

  useEffect(() => {
    fetchGroupChats();
  }, []);

  const classes = useStyles();
  return (
    <Box className={classes.root}>
      {state.error && <Alert severity={"error"}>{state.error}</Alert>}
      {state.loading ? (
        <CircularProgress />
      ) : state.groupChatView.groupChat ? (
        <GroupChatView />
      ) : (
        <>
          <GroupChatList />
          <CreateGroupChat />
        </>
      )}
    </Box>
  );
});
