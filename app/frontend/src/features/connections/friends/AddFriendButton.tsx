import { makeStyles } from "@material-ui/core";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React from "react";
import { useQueryClient, useMutation } from "react-query";
import { SetMutationError } from ".";
import Button from "../../../components/Button";
import { PersonAddIcon } from "../../../components/Icons";
import { service } from "../../../service";

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

  const { isLoading, mutate: sendFriendRequest, reset } = useMutation<
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
        reset();
        sendFriendRequest({ userId, setMutationError });
      }}
      loading={isLoading}
    >
      Add friend
    </Button>
  );
}
