import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import React from "react";

import { timestamp2Date } from "../../../utils/date";
import { firstName } from "../../../utils/names";
import { useAuthContext } from "../../auth/AuthProvider";
import { useUser } from "../../userQueries/useUsers";
import useOnVisibleEffect from "../useOnVisibleEffect";
import { controlMessageText, messageTargetId } from "../utils";
import { MessageProps } from "./MessageView";
import TimeInterval from "./MomentIndication";

const useStyles = makeStyles((theme) => ({
  root: {
    marginInline: "auto",
    textAlign: "center",
  },
  timestamp: {
    color: theme.typography.caption.color,
    fontSize: theme.typography.caption.fontSize,
  },
  message: {
    paddingInlineEnd: theme.spacing(1),
  },
  skeleton: { minWidth: 100 },
}));

export default function ControlMessageView({
  message,
  onVisible,
  className,
}: MessageProps) {
  const classes = useStyles();
  const currentUserId = useAuthContext().authState.userId;
  const { data: author, isLoading: isAuthorLoading } = useUser(
    message.authorUserId
  );
  const { data: target, isLoading: isTargetLoading } = useUser(
    messageTargetId(message)
  );
  const { ref } = useOnVisibleEffect(message.messageId, onVisible);

  const isCurrentUser = author?.userId === currentUserId;
  const authorName = isCurrentUser ? "you" : firstName(author?.name);
  const targetName = firstName(target?.name);
  return (
    <Box
      className={classNames(classes.root, className)}
      data-testid={`message-${message.messageId}`}
      ref={ref}
      id={`message-${message.messageId}`}
    >
      <Box className={classes.timestamp}>
        <TimeInterval date={timestamp2Date(message.time!)} />
      </Box>

      <Box className={classes.message}>
        {!isAuthorLoading && !isTargetLoading ? (
          controlMessageText(message, authorName, targetName)
        ) : (
          <Skeleton className={classes.skeleton} />
        )}
      </Box>
    </Box>
  );
}
