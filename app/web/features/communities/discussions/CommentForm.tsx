import { Collapse, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import MarkdownInput, { MarkdownInputProps } from "components/MarkdownInput";
import { threadKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { PostReplyRes } from "proto/threads_pb";
import React, { useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  commentForm: {
    display: "flex",
    flexDirection: "column",
    "& > :not(:last-child)": {
      marginBlockEnd: theme.spacing(1),
    },
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
  threadId: number;
}

interface CommentData {
  content: string;
}

function _CommentForm(
  { hideable = false, onClose, shown = false, threadId }: CommentFormProps,
  ref: React.ForwardedRef<HTMLFormElement>
) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const classes = useStyles();
  const {
    control,
    handleSubmit,
    reset: resetForm,
  } = useForm<CommentData>({
    mode: "onBlur",
  });
  const resetInputRef: MarkdownInputProps["resetInputRef"] = useRef(null);

  const queryClient = useQueryClient();
  const {
    error,
    isLoading,
    mutate: postComment,
    reset: resetMutation,
  } = useMutation<PostReplyRes.AsObject, RpcError, CommentData>(
    ({ content }) => service.threads.postReply(threadId, content),
    {
      onSuccess() {
        queryClient.invalidateQueries(threadKey(threadId));
        resetForm();
        resetInputRef.current?.();
        resetMutation();
        onClose?.();
      },
    }
  );

  const onSubmit = handleSubmit((data) => {
    postComment(data);
  });

  return (
    <Collapse data-testid={`comment-${threadId}-comment-form`} in={shown}>
      <form className={classes.commentForm} onSubmit={onSubmit} ref={ref}>
        {error && <Alert severity="error">{error.message}</Alert>}
        <Typography id={`comment-${threadId}-reply-label`} variant="srOnly">
          {t("communities:write_comment_a11y_label")}
        </Typography>
        <MarkdownInput
          control={control}
          id={`comment-${threadId}-reply`}
          resetInputRef={resetInputRef}
          labelId={`comment-${threadId}-reply-label`}
          name="content"
        />
        <div className={classes.buttonsContainer}>
          {hideable && <Button onClick={onClose}>{t("global:close")}</Button>}
          <Button loading={isLoading} type="submit">
            {t("communities:comment")}
          </Button>
        </div>
      </form>
    </Collapse>
  );
}

const CommentForm = React.forwardRef(_CommentForm);
export default CommentForm;
