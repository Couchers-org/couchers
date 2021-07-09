import { Card, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import MarkdownInput from "components/MarkdownInput";
import TextField from "components/TextField";
import { CANCEL } from "features/constants";
import { useForm } from "react-hook-form";
import makeStyles from "utils/makeStyles";

import {
  CREATE_NEW_DISCUSSION_TITLE,
  NEW_DISCUSSION_TITLE,
  NEW_DISCUSSION_TOPIC,
  POST,
} from "../constants";
import { CreateDiscussionInput, useNewDiscussionMutation } from "../hooks";

const useStyles = makeStyles((theme) => ({
  root: {
    "& > :not(:last-child)": {
      marginBlockEnd: theme.spacing(3),
    },
    marginBlockEnd: theme.spacing(5),
    padding: theme.spacing(3),
  },
  title: {
    marginTop: 0,
  },
  form: {
    "& > * + *": {
      marginBlockStart: theme.spacing(3),
    },
  },
  actionButtonsContainer: {
    "& > * + *": {
      marginInlineStart: theme.spacing(3),
    },
    display: "flex",
    justifyContent: "flex-end",
  },
}));

export interface CreateDiscussionFormProps {
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
  const classes = useStyles();
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
    isLoading,
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
    <Card className={classes.root}>
      <Typography className={classes.title} variant="h2">
        {CREATE_NEW_DISCUSSION_TITLE}
      </Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      <form className={classes.form} onSubmit={onSubmit}>
        <TextField
          fullWidth
          id="title"
          name="title"
          inputRef={register({ required: true })}
          label={NEW_DISCUSSION_TITLE}
        />
        <Typography id="content-label" variant="h3">
          {NEW_DISCUSSION_TOPIC}
        </Typography>
        <MarkdownInput
          control={control}
          id="content"
          labelId="content-label"
          name="content"
        />
        <div className={classes.actionButtonsContainer}>
          <Button loading={isLoading} type="submit">
            {POST}
          </Button>
          <Button onClick={handleCancel}>{CANCEL}</Button>
        </div>
      </form>
    </Card>
  );
}
