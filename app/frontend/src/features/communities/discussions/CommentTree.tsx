import { CircularProgress, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { COMMENTS, NO_COMMENTS } from "../constants";
import { useThread } from "../hooks";
import Comment from "./Comment";

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

  return (
    <>
      <Typography className={classes.commentsHeader} variant="h2">
        {COMMENTS}
      </Typography>
      {commentsError && <Alert severity="error">{commentsError.message}</Alert>}
      {isCommentsLoading ? (
        <CircularProgress />
      ) : hasAtLeastOnePage(comments, "repliesList") ? (
        <div className={classes.commentsListContainer}>
          {comments.pages
            .flatMap((page) => page.repliesList)
            .map((reply) => {
              return (
                <Comment
                  key={reply.createdTime?.seconds}
                  topLevel
                  reply={reply}
                />
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
