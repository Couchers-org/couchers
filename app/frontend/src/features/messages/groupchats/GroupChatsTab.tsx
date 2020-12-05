import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { useEffect, useState } from "react";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { User } from "../../../pb/api_pb";
import { GroupChat } from "../../../pb/conversations_pb";
import { service } from "../../../service";
import CreateGroupChat from "./CreateGroupChat";
import GroupChatList from "./GroupChatList";
import GroupChatView from "./GroupChatView";

const useStyles = makeStyles({ root: {} });

export default function GroupChatsTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [groupChats, setGroupChats] = useState<GroupChat.AsObject[]>([]);
  const [groupChat, setGroupChat] = useState<GroupChat.AsObject | null>(null);

  async function createGroupChat(title: string, users: User.AsObject[]) {
    setLoading(true);
    try {
      const groupChatId = await service.conversations.createGroupChat(
        title,
        users
      );
      const groupChats = await service.conversations.listGroupChats();
      setGroupChats(groupChats);
      const groupChat =
        groupChats.find((groupChat) => groupChat.groupChatId === groupChatId) ||
        null;
      setGroupChat(groupChat);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function fetchGroupChats() {
    setLoading(true);
    try {
      setGroupChats(await service.conversations.listGroupChats());
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  }

  function handleClose() {
    setGroupChat(null);
    void fetchGroupChats();
  }

  useEffect(() => {
    void fetchGroupChats();
  }, []);

  const classes = useStyles();
  return (
    <Box className={classes.root}>
      {error && <Alert severity={"error"}>{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : groupChat ? (
        <GroupChatView groupChat={groupChat} handleClose={handleClose} />
      ) : (
        <>
          <GroupChatList groupChats={groupChats} setGroupChat={setGroupChat} />
          <CreateGroupChat createGroupChat={createGroupChat} />
        </>
      )}
    </Box>
  );
}
