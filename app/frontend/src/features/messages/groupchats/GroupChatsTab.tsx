import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { useEffect } from "react";
import { fetchGroupChats } from ".";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { useAppDispatch, useTypedSelector } from "../../../store";
import CreateGroupChat from "./CreateGroupChat";
import GroupChatList from "./GroupChatList";
import GroupChatView from "./GroupChatView";

const useStyles = makeStyles({ root: {} });

export default function GroupChatsTab() {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((state) => state.groupChats);

  useEffect(() => {
    dispatch(fetchGroupChats());
  }, [dispatch]);

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
}
