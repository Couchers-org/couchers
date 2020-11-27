import { Box, BoxProps, Link } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { useEffect, useRef, useState } from "react";
import { User } from "../../../pb/api_pb";
import { GroupChat } from "../../../pb/conversations_pb";
import { service } from "../../../service";
import { useAppDispatch, useTypedSelector } from "../../../store";
import { fetchUsers, getUsers } from "../../userCache";
import GroupChatItem from "./GroupChatItem";

const useStyles = makeStyles({ root: {} });

export interface GroupChatListProps extends BoxProps {
  setGroupChat: (groupChat: GroupChat.AsObject) => void;
  groupChats: Array<GroupChat.AsObject>;
}

export function useFindUsers(ids: number[]): User.AsObject[] {
  const notFound: number[] = [];
  const usersRef = useRef<User.AsObject[]>([]);
  const [idsString, setIdsString] = useState<string>("");
  const allUsers = useTypedSelector((state) => getUsers(state));
  const dispatch = useAppDispatch();
  usersRef.current = [];
  const users = usersRef.current;
  for (const id of ids) {
    const user = allUsers[id];
    if (user) {
      users.push(user.user);
    } else {
      notFound.push(id);
    }
  }
  const newIdsString = "" + ids.sort((a, b) => a - b);
  if (newIdsString !== idsString) {
    setIdsString(newIdsString);
    if (notFound.length) {
      dispatch(fetchUsers({ userIds: notFound }));
    }
  }
  return usersRef.current;
}

interface CreateGroupChatFormData {
  users: User.AsObject[];
}

export default function GroupChatList({
  groupChats,
  setGroupChat,
}: GroupChatListProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const classes = useStyles();

  return (
    <>
      <Box className={classes.root}>
        {groupChats.map((groupChat) => (
          <Link
            key={groupChat.groupChatId}
            onClick={() => setGroupChat(groupChat)}
          >
            <GroupChatItem groupChat={groupChat} />
          </Link>
        ))}
      </Box>
    </>
  );
}
