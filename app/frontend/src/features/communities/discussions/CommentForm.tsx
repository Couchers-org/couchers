import { Collapse, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import MarkdownInput from "components/MarkdownInput";
import { Error as GrpcError } from "grpc-web";
import { PostReplyRes } from "pb/threads_pb";
import { threadKey } from "queryKeys";
import React from "react";
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
  hideable?: boolean;
  onClose?(): void;
  shown?: boolean;
  testId: string;
  threadId: number;
}

interface CommentData {
  content: string;
}

function _CommentForm(
  {
    hideable = false,
    onClose,
    shown = false,
    testId,
    threadId,
  }: CommentFormProps,
  ref: React.ForwardedRef<HTMLFormElement>
) {
  const classes = useStyles();
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
        // setShowCommentForm(shown);
        resetForm();
        resetMutation();
      },
    }
  );

  const onSubmit = handleSubmit((data) => {
    postComment(data);
  });

  return (
    <Collapse in={shown}>
      <form
        className={classes.commentForm}
        data-testid={testId}
        onSubmit={onSubmit}
        ref={ref}
      >
        {error && <Alert severity="error">{error.message}</Alert>}
        <Typography id={`comment-${threadId}-reply-label`} variant="srOnly">
          {WRITE_COMMENT_A11Y_LABEL}
        </Typography>
        <MarkdownInput
          control={control}
          id={`comment-${threadId}-reply`}
          labelId={`comment-${threadId}-reply-label`}
          name="content"
        />
        <div className={classes.buttonsContainer}>
          {hideable && <Button onClick={onClose}>{CLOSE}</Button>}
          <Button loading={isLoading} type="submit">
            {COMMENT}
          </Button>
        </div>
      </form>
    </Collapse>
  );
}

const CommentForm = React.forwardRef(_CommentForm);
export default CommentForm;
