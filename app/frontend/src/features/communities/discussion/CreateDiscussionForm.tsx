import { Card, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { CANCEL } from "features/constants";
import { useForm } from "react-hook-form";
import makeStyles from "utils/makeStyles";

import {
  CREATE_NEW_DISCUSSION_TITLE,
  CREATE_NEW_DISCUSSION_TOPIC,
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
  onPost?(): void;
}

type CreateDiscussionData = Omit<CreateDiscussionInput, "ownerCommunityId">;

export default function CreateDiscussionForm({
  communityId,
  onCancel,
  onPost,
}: CreateDiscussionFormProps) {
  const classes = useStyles();
  const {
    handleSubmit,
    reset: resetForm,
    register,
  } = useForm<CreateDiscussionData>({
    mode: "onBlur",
  });

  const {
    error,
    mutate: createDiscussion,
    reset: resetMutation,
  } = useNewDiscussionMutation(handleSuccess);

  function handleSuccess() {
    resetForm();
    resetMutation();
  }

  const handleCancel = () => {
    onCancel?.();
    resetForm();
    resetMutation();
  };

  const handlePost = () => {
    onPost?.();
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
        <TextField
          fullWidth
          id="content"
          name="content"
          inputRef={register({ required: true })}
          label={NEW_DISCUSSION_TOPIC}
          multiline
          placeholder={CREATE_NEW_DISCUSSION_TOPIC}
          rows={6}
        />
        <div className={classes.actionButtonsContainer}>
          <Button onClick={handlePost} type="submit">
            {POST}
          </Button>
          <Button onClick={handleCancel}>{CANCEL}</Button>
        </div>
      </form>
    </Card>
  );
}
