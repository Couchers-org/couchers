import { Collapse, styled } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import MarkdownInput, { MarkdownInputProps } from "components/MarkdownInput";
import ProfileIncompleteDialog, {
  ProfileIncompleteAction,
} from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import useAccountInfo from "features/auth/useAccountInfo";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { service } from "service";
import { theme } from "theme";

import { PostReplyRes } from "../../../proto/threads_pb";
import { threadKey } from "../../queryKeys";

const StyledForm = styled("form")(() => ({
  display: "flex",
  flexDirection: "column",
  "& > :not(:last-child)": {
    marginBlockEnd: theme.spacing(1),
  },
}));

const StyledButtonsContainer = styled("div")(() => ({
  display: "flex",
  gap: 1,
  justifyContent: "flex-end",
  "& > * + *": {
    marginInlineStart: theme.spacing(2),
  },
}));

interface CommentFormProps {
  attemptedAction?: ProfileIncompleteAction;
  hideable?: boolean;
  onClose?(): void;
  shown?: boolean;
  threadId: number;
}

interface CommentData {
  content: string;
}

function InternalCommentForm(
  {
    attemptedAction,
    hideable = false,
    onClose,
    shown = false,
    threadId,
  }: CommentFormProps,
  ref: React.ForwardedRef<HTMLFormElement>,
) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const { data: accountInfo } = useAccountInfo();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  // Opt-in gate: only enforced when a caller passes attemptedAction (currently
  // only the event comment box). Discussions/groups/pages leave it undefined
  // and are unaffected.
  const profileIncomplete =
    attemptedAction !== undefined && accountInfo?.profileComplete === false;
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
    isPending,
    mutate: postComment,
    reset: resetMutation,
  } = useMutation<PostReplyRes.AsObject, RpcError, CommentData>({
    mutationFn: ({ content }) => service.threads.postReply(threadId, content),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: threadKey(threadId) });
      resetForm();
      resetInputRef.current?.();
      resetMutation();
      onClose?.();
    },
  });

  const onSubmit = handleSubmit((data) => {
    if (profileIncomplete) {
      setProfileDialogOpen(true);
      return;
    }

    const trimmedValue = data.content.trim();
    const newData = {
      content: trimmedValue,
    };

    postComment(newData);
  });

  return (
    <Collapse data-testid={`comment-${threadId}-comment-form`} in={shown}>
      {attemptedAction && (
        <ProfileIncompleteDialog
          open={profileDialogOpen}
          onClose={() => setProfileDialogOpen(false)}
          attempted_action={attemptedAction}
        />
      )}
      <StyledForm onSubmit={onSubmit} ref={ref}>
        {error && <Alert severity="error">{error.message}</Alert>}
        <span style={visuallyHidden} id={`comment-${threadId}-reply-label`}>
          {t("communities:write_comment_a11y_label")}
        </span>
        <MarkdownInput
          control={control}
          id={`comment-${threadId}-reply`}
          resetInputRef={resetInputRef}
          labelId={`comment-${threadId}-reply-label`}
          name="content"
          required={t("communities:fill_out_comment")}
        />
        <StyledButtonsContainer>
          {hideable && (
            <Button onClick={onClose} variant="outlined">
              {t("global:close")}
            </Button>
          )}
          <Button loading={isPending} type="submit">
            {t("communities:comment")}
          </Button>
        </StyledButtonsContainer>
      </StyledForm>
    </Collapse>
  );
}

const CommentForm = React.forwardRef(InternalCommentForm);
export default CommentForm;
