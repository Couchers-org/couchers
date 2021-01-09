import { Box, Card, CardContent, IconButton } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import React, { useState } from "react";
import Avatar from "../../../components/Avatar";
import { Message } from "../../../pb/conversations_pb";
import { timestamp2Date } from "../../../utils/date";
import useCurrentUser from "../../userQueries/useCurrentUser";
import { useUser } from "../../userQueries/useUsers";
import TimeInterval from "./MomentIndication";
import UserName from "./UserName";

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
  const { data: author } = useUser(message.authorUserId);
  const { data: currentUser } = useCurrentUser();
  const isCurrentUser = author?.userId === currentUser?.userId;
  return (
    <Card className={classes.root}>
      {author && !isCurrentUser && <Avatar user={author} />}
      <Box className={classes.card}>
        <Box className={classes.header}>
          {author && <UserName user={author} className={classes.name} />}
          <TimeInterval date={timestamp2Date(message.time!)} />
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
      {currentUser && isCurrentUser && <Avatar user={currentUser} />}
    </Card>
  );
}
