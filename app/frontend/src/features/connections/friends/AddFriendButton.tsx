import { makeStyles } from "@material-ui/core";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React from "react";
import { useMutation, useQueryClient } from "react-query";

import Button from "../../../components/Button";
import { PersonAddIcon } from "../../../components/Icons";
import { service } from "../../../service";
import { SetMutationError } from ".";

const useStyles = makeStyles((theme) => ({
  editButton: {
    marginBottom: theme.spacing(2),
  },
}));

interface AddFriendButtonProps {
  setMutationError: SetMutationError;
  userId: number;
}

export default function AddFriendButton({
  setMutationError,
  userId,
}: AddFriendButtonProps) {
  const classes = useStyles();
  const queryClient = useQueryClient();

  const { isLoading, mutate: sendFriendRequest } = useMutation<
    Empty,
    Error,
    AddFriendButtonProps
  >(({ userId }) => service.api.sendFriendRequest(userId), {
    onMutate: ({ setMutationError }) => {
      setMutationError("");
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries(["user", userId]);
    },
    onError: (error, { setMutationError }) => {
      setMutationError(error.message);
    },
  });

  return (
    <Button
      startIcon={<PersonAddIcon />}
      className={classes.editButton}
      onClick={() => {
        sendFriendRequest({ userId, setMutationError });
      }}
      loading={isLoading}
    >
      Add friend
    </Button>
  );
}
