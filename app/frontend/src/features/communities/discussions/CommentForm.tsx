import { Collapse, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import MarkdownInput from "components/MarkdownInput";
import { Error as GrpcError } from "grpc-web";
import { PostReplyRes } from "pb/threads_pb";
import { threadKey } from "queryKeys";
import { MouseEventHandler, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";
import makeStyles from "utils/makeStyles";

import { CLOSE, COMMENT, WRITE_COMMENT_A11Y_LABEL } from "../constants";

const useStyles = makeStyles((theme) => ({
  commentForm: {
    display: "flex",
    flexDirection: "column",
    "& > :not(:last-child)": {
      marginBlockEnd: theme.spacing(1),
    },
    gridArea: "commentForm",
  },
  buttonsContainer: {
    display: "flex",
    justifyContent: "flex-end",
    "& > * + *": {
      marginInlineStart: theme.spacing(2),
    },
  },
}));

interface CommentFormProps {
  alwaysShown?: boolean;
  testId: string;
  threadId: number;
}

interface CommentData {
  content: string;
}

export default function CommentForm({
  alwaysShown = false,
  testId,
  threadId,
}: CommentFormProps) {
  const classes = useStyles();
  const [showCommentForm, setShowCommentForm] = useState(alwaysShown);
  const { control, handleSubmit, reset: resetForm } = useForm<CommentData>({
    mode: "onBlur",
  });
  const queryClient = useQueryClient();
  const {
    error,
    isLoading,
    mutate: postComment,
    reset: resetMutation,
  } = useMutation<PostReplyRes.AsObject, GrpcError, CommentData>(
    ({ content }) => service.threads.postReply(threadId, content),
    {
      onSuccess() {
        queryClient.invalidateQueries(threadKey(threadId));
        setShowCommentForm(alwaysShown);
        resetForm();
        resetMutation();
      },
    }
  );

  const onSubmit = handleSubmit((data) => {
    postComment(data);
  });

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (!showCommentForm) {
      // Don't submit form if it is not opened
      event.preventDefault();

      setShowCommentForm(true);
      return;
    }
  };

  return (
    <form
      className={classes.commentForm}
      data-testid={testId}
      onSubmit={onSubmit}
    >
      {error && <Alert severity="error">{error.message}</Alert>}
      <Collapse in={showCommentForm}>
        <Typography id={`comment-${threadId}-reply-label`} variant="srOnly">
          {WRITE_COMMENT_A11Y_LABEL}
        </Typography>
        <MarkdownInput
          control={control}
          id={`comment-${threadId}-reply`}
          labelId={`comment-${threadId}-reply-label`}
          name="content"
        />
      </Collapse>
      <div className={classes.buttonsContainer}>
        {!alwaysShown && showCommentForm && (
          <Button onClick={() => setShowCommentForm(false)}>{CLOSE}</Button>
        )}
        <Button loading={isLoading} onClick={handleClick} type="submit">
          {COMMENT}
        </Button>
      </div>
    </form>
  );
}
