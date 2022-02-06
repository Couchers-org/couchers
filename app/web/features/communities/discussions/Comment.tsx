import { Card, CircularProgress, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import Avatar from "components/Avatar";
import Button from "components/Button";
import Markdown from "components/Markdown";
import { useUser } from "features/userQueries/useUsers";
import { Reply } from "proto/threads_pb";
import { useEffect, useRef, useState } from "react";
import { timestamp2Date } from "utils/date";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";
import { timeAgo } from "utils/timeAgo";

import {
  getByCreator,
  LOAD_EARLIER_REPLIES,
  REPLY,
  UNKNOWN_USER,
} from "../constants";
import { useThread } from "../hooks";
import CommentForm from "./CommentForm";

const useStyles = makeStyles((theme) => ({
  commentContainer: {
    alignItems: "start",
    columnGap: theme.spacing(2),
    display: "grid",
    gridTemplateAreas: `
      "avatar content content"
      ". . replyButton"
    `,
    [theme.breakpoints.up("md")]: {
      gridTemplateAreas: `
        "avatar content replyButton"
      `,
    },
    gridTemplateColumns: "3rem minmax(0, 9fr) 1fr",
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
  replyButton: {
    gridArea: "replyButton",
    placeSelf: "end",
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
    display: "flex",
    flexDirection: "column",
    marginBlockStart: theme.spacing(2),
    marginInlineStart: theme.spacing(3),
    "&": {
      marginInlineStart: `clamp(${theme.spacing(2)}, 5vw, ${theme.spacing(5)})`,
    },
  },
  loadEarlierRepliesButton: {
    alignSelf: "center",
  },
}));

export const COMMENT_TEST_ID = "comment";
export const REFETCH_LOADING_TEST_ID = "refetching";

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
    fetchNextPage,
    hasNextPage,
    isLoading: isCommentsLoading,
    isFetching: isCommentsFetching,
    isFetchingNextPage,
  } = useThread(comment.threadId, { enabled: topLevel });
  const isCommentsRefetching = !isCommentsLoading && isCommentsFetching;
  const showLoadMoreButton = topLevel && hasNextPage;

  const [showCommentForm, setShowCommentForm] = useState(false);
  const commentFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (showCommentForm && commentFormRef.current) {
      commentFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [showCommentForm]);

  const replyDate = timestamp2Date(comment.createdTime!);
  const postedTime = timeAgo(replyDate);

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
          <Button
            className={classes.replyButton}
            onClick={() => {
              setShowCommentForm(true);
            }}
          >
            {REPLY}
          </Button>
        )}
      </Card>
      {isCommentsLoading ? (
        <CircularProgress />
      ) : (
        <div className={classes.nestedCommentsContainer}>
          {!showLoadMoreButton && isCommentsRefetching && (
            <CircularProgress data-testid={REFETCH_LOADING_TEST_ID} />
          )}
          {hasAtLeastOnePage(comments, "repliesList") && (
            <>
              {showLoadMoreButton && (
                <Button
                  className={classes.loadEarlierRepliesButton}
                  loading={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {LOAD_EARLIER_REPLIES}
                </Button>
              )}
              {comments.pages
                .flatMap((page) => page.repliesList)
                .reverse()
                .map((reply) => {
                  return <Comment key={reply.threadId} comment={reply} />;
                })}
            </>
          )}
          {topLevel && (
            <CommentForm
              hideable
              onClose={() => setShowCommentForm(false)}
              ref={commentFormRef}
              shown={showCommentForm}
              threadId={comment.threadId}
            />
          )}
        </div>
      )}
    </>
  );
}
