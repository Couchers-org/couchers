import { Card, CircularProgress, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import useUsers from "features/userQueries/useUsers";
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
    marginBlockStart: theme.spacing(3),
  },
  commentsListContainer: {
    "& > * + *": {
      marginBlockStart: theme.spacing(2),
    },
    marginBlockStart: theme.spacing(2),
  },
  commentContainer: {
    display: "flex",
    padding: theme.spacing(2),
    width: "100%",
  },
  commentContent: {
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
  threadId: number;
}

export default function CommentTree({ threadId }: CommentTreeProps) {
  const classes = useStyles();

  const {
    data: comments,
    error: commentsError,
    isLoading: isCommentsLoading,
  } = useThread(threadId);

  const userIds = hasAtLeastOnePage(comments, "repliesList")
    ? comments.pages.flatMap((page) =>
        page.repliesList.map((reply) => reply.authorUserId)
      )
    : [];
  const { data: users, isLoading: isUsersLoading } = useUsers(userIds);

  return (
    <>
      <Typography className={classes.commentsHeader} variant="h2">
        {COMMENTS}
      </Typography>
      {commentsError && <Alert severity="error">{commentsError.message}</Alert>}
      {isCommentsLoading || isUsersLoading ? (
        <CircularProgress />
      ) : hasAtLeastOnePage(comments, "repliesList") ? (
        <div className={classes.commentsListContainer}>
          {comments.pages
            .flatMap((page) => page.repliesList)
            .map((reply) => {
              const user = users?.get(reply.authorUserId);
              const replyDate = timestamp2Date(reply.createdTime!);
              const postedTime = replyDate
                ? timeAgo(replyDate, false)
                : "sometime";
              return (
                <Card
                  className={classes.commentContainer}
                  key={reply.createdTime!.seconds}
                >
                  <Avatar user={user} className={classes.avatar} />
                  <div className={classes.commentContent}>
                    <Typography variant="body2">
                      {getByCreator(user?.name ?? UNKNOWN_USER)}
                      {` • ${postedTime}`}
                    </Typography>
                    <Typography variant="body1">{reply.content}</Typography>
                  </div>
                </Card>
              );
            })}
        </div>
      ) : (
        comments &&
        !commentsError && <Typography variant="body1">{NO_COMMENTS}</Typography>
      )}
    </>
  );
}
