import { Box, Card, CardContent, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import React from "react";

import Avatar from "../../../components/Avatar";
import { Message } from "../../../pb/conversations_pb";
import { timestamp2Date } from "../../../utils/date";
import useCurrentUser from "../../userQueries/useCurrentUser";
import { useUser } from "../../userQueries/useUsers";
import useOnVisibleEffect from "../useOnVisibleEffect";
import TimeInterval from "./MomentIndication";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    marginTop: theme.spacing(2),
    "& > :first-child": { marginRight: theme.spacing(2) },
  },
  userRoot: { justifyContent: "flex-end" },
  otherRoot: { justifyContent: "flex-start" },
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
  header: {
    display: "flex",
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    alignItems: "center",
  },
  footer: {
    display: "flex",
    paddingInline: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    justifyContent: "flex-end",
  },
  avatar: { width: 40, height: 40 },
  name: {
    flexGrow: 1,
    margin: 0,
    fontSize: theme.typography.body2.fontSize,
    fontWeight: "bold",
  },
  messageBody: {
    paddingTop: 0,
    paddingBottom: theme.spacing(1),
    "&:last-child": { paddingBottom: theme.spacing(2) },
  },
}));

export interface MessageProps {
  message: Message.AsObject;
  onVisible?(messageId: number): void;
}

export default function MessageView({ message, onVisible }: MessageProps) {
  const classes = useStyles();
  const { data: author } = useUser(message.authorUserId);
  const { data: currentUser } = useCurrentUser();
  const isCurrentUser = author?.userId === currentUser?.userId;

  const { ref } = useOnVisibleEffect(message.messageId, onVisible);

  return (
    <Box
      className={classNames(classes.root, {
        [classes.userRoot]: isCurrentUser,
        [classes.otherRoot]: !isCurrentUser,
      })}
      data-testid={`message-${message.messageId}`}
      ref={ref}
      style={{}}
    >
      {author && !isCurrentUser && (
        <Avatar user={author} className={classes.avatar} />
      )}
      <Card
        className={classNames(classes.card, {
          [classes.userCard]: isCurrentUser,
          [classes.otherCard]: !isCurrentUser,
        })}
      >
        <Box className={classes.header}>
          {author && (
            <Typography variant="h5" className={classes.name}>
              {author.name}
            </Typography>
          )}
          {!isCurrentUser && (
            <TimeInterval date={timestamp2Date(message.time!)} />
          )}
        </Box>

        <CardContent className={classes.messageBody}>
          {message.text?.text || ""}
        </CardContent>

        {isCurrentUser && (
          <Box className={classes.footer}>
            <TimeInterval date={timestamp2Date(message.time!)} />
          </Box>
        )}
      </Card>
      {author && isCurrentUser && (
        <Avatar user={author} className={classes.avatar} />
      )}
    </Box>
  );
}
