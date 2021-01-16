import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
} from "@material-ui/core";
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

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    marginTop: theme.spacing(2),
    "& > :first-child": { marginRight: theme.spacing(2) },
  },
  card: {
    [theme.breakpoints.up("xs")]: {
      flexGrow: 1,
    },
    [theme.breakpoints.up("sm")]: {
      flexGrow: 0.8,
    },
    [theme.breakpoints.up("md")]: {
      flexGrow: 0.7,
    },
    borderRadius: theme.shape.borderRadius,
  },
  header: { display: "flex", padding: theme.spacing(2), alignItems: "center" },
  messageTime: {
    color: theme.typography.caption.color,
    fontSize: theme.typography.caption.fontSize,
    paddingInlineEnd: theme.spacing(1),
  },
  name: { flexGrow: 1, margin: 0 },
  expandButton: { width: 20, height: 20 },
}));

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
    <Box
      className={classes.root}
      style={{ justifyContent: !isCurrentUser ? "flex-start" : "flex-end" }}
    >
      {author && !isCurrentUser && <Avatar user={author} />}
      <Card className={classes.card}>
        <Box className={classes.header}>
          {author && (
            <Typography variant="h3" className={classes.name}>
              {author.name}
            </Typography>
          )}
          <TimeInterval
            date={timestamp2Date(message.time!)}
            className={classes.messageTime}
          />
          <IconButton
            className={classes.expandButton}
            onClick={(event) => {
              event.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <CardContent>
          {expanded || (message.text?.text.length ?? 0) <= 100
            ? message.text?.text || ""
            : message.text?.text.substr(0, 100) + "..." || ""}
        </CardContent>
      </Card>
      {author && isCurrentUser && <Avatar user={author} />}
    </Box>
  );
}
