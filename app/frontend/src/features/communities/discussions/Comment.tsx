import { Card, CircularProgress, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import Avatar from "components/Avatar";
import Button from "components/Button";
import { useUser } from "features/userQueries/useUsers";
import { Reply } from "pb/threads_pb";
import { timestamp2Date } from "utils/date";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";
import { timeAgo } from "utils/timeAgo";

import { getByCreator, REPLY, UNKNOWN_USER } from "../constants";
import { useThread } from "../hooks";

const useStyles = makeStyles((theme) => ({
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
    flexGrow: 1,
    marginInlineStart: theme.spacing(3),
    marginInlineEnd: theme.spacing(2),
  },
  avatar: {
    height: "3rem",
    width: "3rem",
  },
  nestedRepliesContainer: {
    "& > * + *": {
      marginBlockStart: theme.spacing(2),
    },
    marginBlockStart: theme.spacing(2),
    marginInlineStart: theme.spacing(5),
  },
}));

interface CommentProps {
  topLevel?: boolean;
  reply: Reply.AsObject;
}

export default function Comment({ topLevel = false, reply }: CommentProps) {
  const classes = useStyles();
  const { data: user, isLoading: isUserLoading } = useUser(reply.authorUserId);

  const {
    data: replies,
    isLoading: isRepliesLoading,
  } = useThread(reply.threadId, { enabled: topLevel });

  const replyDate = timestamp2Date(reply.createdTime!);
  const postedTime = replyDate ? timeAgo(replyDate, false) : "sometime";

  return (
    <>
      <Card className={classes.replyContainer} key={reply.createdTime!.seconds}>
        <Avatar user={user} className={classes.avatar} isProfileLink={false} />
        <div className={classes.replyContent}>
          {isUserLoading ? (
            <Skeleton />
          ) : (
            <Typography variant="body2">
              {getByCreator(user?.name ?? UNKNOWN_USER)}
              {` • ${postedTime}`}
            </Typography>
          )}
          {isUserLoading ? (
            <Skeleton />
          ) : (
            <Typography variant="body1">{reply.content}</Typography>
          )}
        </div>
        {topLevel && <Button>{REPLY}</Button>}
      </Card>
      {isRepliesLoading ? (
        <CircularProgress />
      ) : (
        hasAtLeastOnePage(replies, "repliesList") && (
          <div className={classes.nestedRepliesContainer}>
            {replies.pages
              .flatMap((page) => page.repliesList)
              .map((reply) => {
                return (
                  <Comment key={reply.createdTime?.seconds} reply={reply} />
                );
              })}
          </div>
        )
      )}
    </>
  );
}
