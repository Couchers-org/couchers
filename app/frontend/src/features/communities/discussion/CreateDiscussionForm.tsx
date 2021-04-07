import { makeStyles, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { CANCEL } from "features/constants";
import { useForm } from "react-hook-form";

import {
  CREATE_NEW_DISCUSSION_TITLE,
  CREATE_NEW_DISCUSSION_TOPIC,
  NEW_DISCUSSION_TITLE,
  POST,
} from "../constants";
import { CreateDiscussionInput, useNewDiscussionMutation } from "../hooks";

const useStyles = makeStyles((theme) => ({}));

interface CreateDiscussionFormProps {
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
  const {
    handleSubmit,
    reset: resetForm,
    register,
  } = useForm<CreateDiscussionData>();

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

  // TODO: style/wrap in card
  return (
    <>
      <Typography variant="h2">{CREATE_NEW_DISCUSSION_TITLE}</Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      <form onSubmit={onSubmit}>
        <TextField
          fullWidth
          id="title"
          name="title"
          inputRef={register}
          label={NEW_DISCUSSION_TITLE}
        />
        <TextField
          fullWidth
          id="content"
          name="content"
          inputRef={register}
          label={CREATE_NEW_DISCUSSION_TOPIC}
          multiline
          rows={6}
        />
        <Button onClick={handlePost} type="submit">
          {POST}
        </Button>
        <Button onClick={handleCancel}>{CANCEL}</Button>
      </form>
    </>
  );
}
