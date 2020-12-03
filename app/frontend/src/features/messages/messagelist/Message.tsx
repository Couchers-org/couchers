import { Box, Card, CardContent, IconButton } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import React, { useState } from "react";
import { useStore } from "react-redux";
import Avatar from "../../../components/Avatar";
import { User } from "../../../pb/api_pb";
import { Message } from "../../../pb/conversations_pb";
import { useAppDispatch, useTypedSelector } from "../../../store";
import { fetchUsers, getUser } from "../../userCache";
import TimeInterval from "./MomentIndication";
import UserName from "./UserName";

export function useGetUser(id: number): User.AsObject | null {
  const user = useTypedSelector((state) => getUser(state, id)) || null;
  const dispatch = useAppDispatch();
  if (!user) {
    dispatch(fetchUsers({ userIds: [id] }));
  }
  return user;
}

const useStyles = makeStyles({
  root: { display: "flex" },
  card: { flexGrow: 1 },
  header: { display: "flex" },
  name: { flexGrow: 1 },
});

export interface MessageProps {
  message: Message.AsObject;
}

export default function MessageView({ message }: MessageProps) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const classes = useStyles();
  const author = useGetUser(message.authorUserId);
  const store = useStore();
  const currentUser = store.getState().auth.user;
  const isCurrentUser = author?.userId === currentUser?.userId;
  return (
    <Card className={classes.root}>
      {author && !isCurrentUser && <Avatar user={author} />}
      <Box className={classes.card}>
        <Box className={classes.header}>
          {author && <UserName user={author} className={classes.name} />}
          <TimeInterval date={new Date(message.time!.seconds * 1e3)} />
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <CardContent style={{ maxHeight: expanded ? "unset" : "4em" }}>
          {message.text?.text || ""}
        </CardContent>
      </Box>
      {author && isCurrentUser && <Avatar user={author} />}
    </Card>
  );
}
