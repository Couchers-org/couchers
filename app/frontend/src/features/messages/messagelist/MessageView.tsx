import { Box, Card, CardContent, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import Avatar from "../../../components/Avatar";
import { Message } from "../../../pb/conversations_pb";
import { timestamp2Date } from "../../../utils/date";
import useCurrentUser from "../../userQueries/useCurrentUser";
import { useUser } from "../../userQueries/useUsers";
import TimeInterval from "./MomentIndication";
import classnames from "classnames";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    marginTop: theme.spacing(2),
    "& > :first-child": { marginRight: theme.spacing(2) },
  },
  card: {
    [theme.breakpoints.up("xs")]: {
      width: "100%",
    },
    [theme.breakpoints.up("sm")]: {
      width: "80%",
    },
    [theme.breakpoints.up("md")]: {
      width: "70%",
    },
    border: "1px solid",
    borderRadius: theme.shape.borderRadius,
  },
  userCard: {
    borderColor: theme.palette.secondary.main,
  },
  otherCard: {
    borderColor: theme.palette.primary.main,
  },
  header: { display: "flex", padding: theme.spacing(2), alignItems: "center" },
  messageTime: {
    color: theme.typography.caption.color,
    fontSize: theme.typography.caption.fontSize,
    paddingInlineEnd: theme.spacing(1),
  },
  avatar: { width: 40, height: 40 },
  name: { flexGrow: 1, margin: 0 },
  messageBody: { paddingTop: 0 },
}));

export interface MessageProps {
  message: Message.AsObject;
}

export default function MessageView({ message }: MessageProps) {
  const classes = useStyles();
  const { data: author } = useUser(message.authorUserId);
  const { data: currentUser } = useCurrentUser();
  const isCurrentUser = author?.userId === currentUser?.userId;
  return (
    <Box
      className={classes.root}
      style={{ justifyContent: !isCurrentUser ? "flex-start" : "flex-end" }}
    >
      {author && !isCurrentUser && (
        <Avatar user={author} className={classes.avatar} />
      )}
      <Card
        className={classnames(classes.card, {
          [classes.userCard]: isCurrentUser,
          [classes.otherCard]: !isCurrentUser,
        })}
      >
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
        </Box>

        <CardContent className={classes.messageBody}>
          {message.text?.text || ""}
        </CardContent>
      </Card>
      {author && isCurrentUser && (
        <Avatar user={author} className={classes.avatar} />
      )}
    </Box>
  );
}
