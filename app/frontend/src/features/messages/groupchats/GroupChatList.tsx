import { Box, Link } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { observer } from "mobx-react-lite";
import React from "react";
import { GroupChat } from "../../../pb/conversations_pb";
import GroupChatListItem from "./GroupChatListItem";
import { groupChatsState } from "./groupChatsSlice";

const useStyles = makeStyles({ root: {} });

export default observer(function GroupChatList() {
  const dispatchSetGroupChat = (groupChat: GroupChat.AsObject | null) =>
    groupChatsState.groupChatView.setGroupChat(groupChat!);

  const classes = useStyles();
  return (
    <>
      <Box className={classes.root}>
        {groupChatsState.groupChats.map((groupChat) => (
          <Link
            key={groupChat.groupChatId}
            onClick={() => dispatchSetGroupChat(groupChat)}
          >
            <GroupChatListItem groupChat={groupChat} />
          </Link>
        ))}
      </Box>
    </>
  );
});
