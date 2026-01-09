import { Card, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import MarkdownInput from "components/MarkdownInput";
import TextField from "components/TextField";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useForm } from "react-hook-form";
import { theme } from "theme";

import { CreateDiscussionInput, useNewDiscussionMutation } from "../hooks";

const StyledWrapper = styled(Card)(() => ({
  "& > :not(:last-child)": {
    marginBlockEnd: theme.spacing(3),
  },
  marginBlockEnd: theme.spacing(5),
  padding: theme.spacing(3),
}));

const StyledTitle = styled(Typography)(() => ({ marginTop: 0 }));

const StyledForm = styled("form")(() => ({
  "& > * + *": {
    marginBlockStart: theme.spacing(3),
  },
}));

const StyledActionButtonsContainer = styled("div")(() => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
}));

const StyledCancelButton = styled(Button)(() => ({
  backgroundColor: "var(--mui-palette-grey-50)",
  color: "var(--mui-palette-grey-800)",
  "&:hover": {
    backgroundColor: "var(--mui-palette-grey-100)",
  },
}));

interface CreateDiscussionFormProps {
  communityId: number;
  onCancel?(): void;
  onPostSuccess?(): void;
}

type CreateDiscussionData = Omit<CreateDiscussionInput, "ownerCommunityId">;

export default function CreateDiscussionForm({
  communityId,
  onCancel,
  onPostSuccess,
}: CreateDiscussionFormProps) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const {
    control,
    handleSubmit,
    reset: resetForm,
    register,
  } = useForm<CreateDiscussionData>({
    mode: "onBlur",
  });

  const {
    error,
    isPending,
    mutate: createDiscussion,
    reset: resetMutation,
  } = useNewDiscussionMutation(handleSuccess);

  function handleSuccess() {
    resetForm();
    resetMutation();
    onPostSuccess?.();
  }

  const handleCancel = () => {
    onCancel?.();
    resetForm();
    resetMutation();
  };

  const onSubmit = handleSubmit((data) => {
    createDiscussion({ ...data, ownerCommunityId: communityId });
  });

  return (
    <StyledWrapper>
      <StyledTitle variant="h2">
        {t("communities:create_new_discussion_title")}
      </StyledTitle>
      {error && <Alert severity="error">{error.message}</Alert>}
      <StyledForm onSubmit={onSubmit}>
        <TextField
          id="title"
          {...register("title", { required: true })}
          fullWidth
          label={t("communities:new_discussion_title")}
        />
        <Typography id="content-label" variant="h3">
          {t("communities:new_discussion_topic")}
        </Typography>
        <MarkdownInput
          control={control}
          id="content"
          labelId="content-label"
          name="content"
        />
        <StyledActionButtonsContainer>
          <StyledCancelButton onClick={handleCancel}>
            {t("global:cancel")}
          </StyledCancelButton>
          <Button loading={isPending} type="submit">
            {t("communities:post")}
          </Button>
        </StyledActionButtonsContainer>
      </StyledForm>
    </StyledWrapper>
  );
}
