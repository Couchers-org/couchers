import { Box, Card, CardContent, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import React from "react";

import Avatar from "../../../components/Avatar";
import TextBody from "../../../components/TextBody";
import { Message } from "../../../pb/conversations_pb";
import { timestamp2Date } from "../../../utils/date";
import useCurrentUser from "../../userQueries/useCurrentUser";
import { useUser } from "../../userQueries/useUsers";
import useOnVisibleEffect from "../useOnVisibleEffect";
import TimeInterval from "./TimeInterval";

export const messageElementId = (id: number) => `message-${id}`;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    "& > :first-child": { marginRight: theme.spacing(2) },
  },
  userRoot: { justifyContent: "flex-end" },
  otherRoot: { justifyContent: "flex-start" },
  loadingRoot: { justifyContent: "center" },
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
  loadingCard: {
    borderColor: theme.palette.text.secondary,
  },
  header: {
    display: "flex",
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    alignItems: "center",
  },
  footer: {
    display: "flex",
    paddingInlineStart: theme.spacing(2),
    paddingInlineEnd: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    justifyContent: "flex-end",
  },
  avatar: { width: 40, height: 40 },
  name: {
    ...theme.typography.body2,
    flexGrow: 1,
    margin: 0,
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
  onVisible?(): void;
  className?: string;
}

export default function MessageView({
  message,
  onVisible,
  className,
}: MessageProps) {
  const classes = useStyles();
  const { data: author, isLoading: isAuthorLoading } = useUser(
    message.authorUserId
  );
  const {
    data: currentUser,
    isLoading: isCurrentUserLoading,
  } = useCurrentUser();
  const isLoading = isAuthorLoading || isCurrentUserLoading;
  const isCurrentUser = author?.userId === currentUser?.userId;

  const { ref } = useOnVisibleEffect(onVisible);

  return (
    <Box
      className={classNames(classes.root, className, {
        [classes.loadingRoot]: isLoading,
        [classes.userRoot]: isCurrentUser && !isLoading,
        [classes.otherRoot]: !isCurrentUser && !isLoading,
      })}
      data-testid={`message-${message.messageId}`}
      ref={ref}
      id={messageElementId(message.messageId)}
    >
      {author && !isCurrentUser && (
        <Avatar user={author} className={classes.avatar} />
      )}
      <Card
        className={classNames(classes.card, {
          [classes.loadingCard]: isLoading,
          [classes.userCard]: isCurrentUser && !isLoading,
          [classes.otherCard]: !isCurrentUser && !isLoading,
        })}
      >
        <Box className={classes.header}>
          {author ? (
            <Typography variant="h5" className={classes.name}>
              {author.name}
            </Typography>
          ) : (
            <Skeleton width={100} />
          )}
          {!isCurrentUser && (
            <TimeInterval date={timestamp2Date(message.time!)} />
          )}
        </Box>

        <CardContent className={classes.messageBody}>
          <TextBody>{message.text?.text || ""}</TextBody>
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
