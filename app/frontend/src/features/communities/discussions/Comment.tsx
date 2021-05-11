import { Card, CircularProgress, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import Avatar from "components/Avatar";
import Markdown from "components/Markdown";
import { useUser } from "features/userQueries/useUsers";
import { Reply } from "pb/threads_pb";
import { timestamp2Date } from "utils/date";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";
import { timeAgo } from "utils/timeAgo";

import { getByCreator, UNKNOWN_USER } from "../constants";
import { useThread } from "../hooks";
import CommentForm from "./CommentForm";

const useStyles = makeStyles((theme) => ({
  commentContainer: {
    alignItems: "start",
    columnGap: theme.spacing(2),
    display: "grid",
    gridTemplateAreas: `
      "avatar content"
      "commentForm commentForm"
    `,
    gridTemplateColumns: "3rem 1fr",
    gridTemplateRows: "auto",
    padding: theme.spacing(2),
    width: "100%",
  },
  commentContent: {
    "& > * + *": {
      marginBlockStart: theme.spacing(0.5),
    },
    display: "flex",
    flexDirection: "column",
    gridArea: "content",
    marginInlineStart: theme.spacing(1),
  },
  avatar: {
    height: "3rem",
    gridArea: "avatar",
    width: "3rem",
  },
  nestedCommentsContainer: {
    "& > * + *": {
      marginBlockStart: theme.spacing(2),
    },
    marginBlockStart: theme.spacing(2),
    marginInlineStart: theme.spacing(3),
    "&": {
      marginInlineStart: `clamp(${theme.spacing(2)}, 5vw, ${theme.spacing(5)})`,
    },
  },
}));

export const COMMENT_TEST_ID = "comment";

interface CommentProps {
  comment: Reply.AsObject;
  topLevel?: boolean;
}

export default function Comment({ topLevel = false, comment }: CommentProps) {
  const classes = useStyles();
  const { data: user, isLoading: isUserLoading } = useUser(
    comment.authorUserId
  );

  const {
    data: comments,
    isLoading: isCommentsLoading,
    isFetching: isCommentsFetching,
  } = useThread(comment.threadId, { enabled: topLevel });
  const isCommentsRefetching = !isCommentsLoading && isCommentsFetching;

  const replyDate = timestamp2Date(comment.createdTime!);
  const postedTime = timeAgo(replyDate, false);

  return (
    <>
      <Card className={classes.commentContainer} data-testid={COMMENT_TEST_ID}>
        <Avatar user={user} className={classes.avatar} />
        <div className={classes.commentContent}>
          {isUserLoading ? (
            <Skeleton />
          ) : (
            <Typography variant="body2">
              {getByCreator(user?.name ?? UNKNOWN_USER)}
              {` • ${postedTime}`}
            </Typography>
          )}
          {isUserLoading ? <Skeleton /> : <Markdown source={comment.content} />}
        </div>
        {topLevel && (
          <CommentForm
            testId={`comment-${comment.threadId}-comment-form`}
            threadId={comment.threadId}
          />
        )}
      </Card>
      {isCommentsLoading ? (
        <CircularProgress />
      ) : (
        hasAtLeastOnePage(comments, "repliesList") && (
          <>
            {isCommentsRefetching && <CircularProgress />}
            <div className={classes.nestedCommentsContainer}>
              {comments.pages
                .flatMap((page) => page.repliesList)
                .map((reply) => (
                  <Comment key={reply.threadId} comment={reply} />
                ))}
            </div>
          </>
        )
      )}
    </>
  );
}
