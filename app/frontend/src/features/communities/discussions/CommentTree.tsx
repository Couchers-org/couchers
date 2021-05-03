import { Card, CircularProgress, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import useUsers from "features/userQueries/useUsers";
import { Discussion } from "pb/discussions_pb";
import { timestamp2Date } from "utils/date";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";
import { timeAgo } from "utils/timeAgo";

import {
  COMMENTS,
  getByCreator,
  NO_COMMENTS,
  UNKNOWN_USER,
} from "../constants";
import { useThread } from "../hooks";

const useStyles = makeStyles((theme) => ({
  commentsHeader: {
    marginTop: theme.spacing(2),
  },
  repliesListContainer: {
    "& > * + *": {
      marginBlockStart: theme.spacing(2),
    },
    marginBlockStart: theme.spacing(2),
  },
  replyContainer: {
    display: "flex",
    padding: theme.spacing(2),
    width: "100%",
  },
  replyContent: {
    "& > * + *": {
      marginBlockStart: theme.spacing(0.5),
    },
    display: "flex",
    flexDirection: "column",
    marginInlineStart: theme.spacing(3),
  },
  avatar: {
    height: "3rem",
    width: "3rem",
  },
}));

interface CommentTreeProps {
  discussion: Discussion.AsObject;
}

export default function CommentTree({ discussion }: CommentTreeProps) {
  const classes = useStyles();

  const {
    data: discussionThread,
    error: threadError,
    isLoading: isThreadLoading,
  } = useThread(discussion.threadId);

  const userIds = hasAtLeastOnePage(discussionThread, "repliesList")
    ? discussionThread.pages.flatMap((page) =>
        page.repliesList.map((reply) => reply.authorUserId)
      )
    : [];
  const { data: users, isLoading: isUsersLoading } = useUsers(userIds);

  return (
    <>
      <Typography className={classes.commentsHeader} variant="h2">
        {COMMENTS}
      </Typography>
      {threadError && <Alert severity="error">{threadError.message}</Alert>}
      {isThreadLoading || isUsersLoading ? (
        <CircularProgress />
      ) : hasAtLeastOnePage(discussionThread, "repliesList") ? (
        <div className={classes.repliesListContainer}>
          {discussionThread.pages
            .flatMap((page) => page.repliesList)
            .map((reply) => {
              const user = users?.get(reply.authorUserId);
              const replyDate = timestamp2Date(reply.createdTime!);
              const posted = replyDate ? timeAgo(replyDate, false) : "sometime";
              return (
                <Card
                  className={classes.replyContainer}
                  key={reply.createdTime!.seconds}
                >
                  <Avatar
                    user={user}
                    className={classes.avatar}
                    isProfileLink={false}
                  />
                  <div className={classes.replyContent}>
                    <Typography variant="body2">
                      {getByCreator(user?.name ?? UNKNOWN_USER)}
                      {` • ${posted}`}
                    </Typography>
                    <Typography variant="body1">{reply.content}</Typography>
                  </div>
                </Card>
              );
            })}
        </div>
      ) : (
        discussionThread &&
        !threadError && <Typography variant="body1">{NO_COMMENTS}</Typography>
      )}
    </>
  );
}
