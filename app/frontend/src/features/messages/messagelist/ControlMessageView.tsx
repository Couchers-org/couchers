import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import React from "react";
import { timestamp2Date } from "../../../utils/date";
import { firstName } from "../../../utils/names";
import { useAuthContext } from "../../auth/AuthProvider";
import { useUser } from "../../userQueries/useUsers";
import { controlMessageText, messageTargetId } from "../utils";
import { MessageProps } from "./MessageView";
import TimeInterval from "./MomentIndication";

const useStyles = makeStyles({
  root: { display: "flex" },
  timestamp: {},
  message: {},
  skeleton: { minWidth: 100 },
});

export default function ControlMessageView({ message }: MessageProps) {
  const classes = useStyles();
  const currentUserId = useAuthContext().authState.userId;
  const { data: author, isLoading: isAuthorLoading } = useUser(
    message.authorUserId
  );
  const { data: target, isLoading: isTargetLoading } = useUser(
    messageTargetId(message)
  );
  const isCurrentUser = author?.userId === currentUserId;
  const authorName = isCurrentUser ? "you" : firstName(author?.name);
  const targetName = firstName(target?.name);
  return (
    <Box className={classes.root}>
      <Box className={classes.timestamp}>
        <TimeInterval date={timestamp2Date(message.time!)} />
      </Box>

      <Box className={classes.message}>
        {!isAuthorLoading && !isTargetLoading ? (
          controlMessageText(message, authorName!, targetName)
        ) : (
          <Skeleton className={classes.skeleton} />
        )}
      </Box>
    </Box>
  );
}
