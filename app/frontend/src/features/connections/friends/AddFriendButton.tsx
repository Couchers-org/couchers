import classNames from "classnames";
import Button from "components/Button";
import { PersonAddIcon } from "components/Icons";
import { ADD_FRIEND, PENDING } from "features/connections/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";
import makeStyles from "utils/makeStyles";

import { SetMutationError } from ".";

const useStyles = makeStyles((theme) => ({
  disabledButton: {
    backgroundColor: theme.palette.grey[100],
  },
}));

interface AddFriendButtonProps {
  isPending: boolean;
  setMutationError: SetMutationError;
  userId: number;
}

export default function AddFriendButton({
  isPending,
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
    onError: (error, { setMutationError }) => {
      setMutationError(error.message);
    },
    onMutate: ({ setMutationError }) => {
      setMutationError("");
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries(["user", userId]);
    },
  });

  return (
    <Button
      startIcon={<PersonAddIcon />}
      className={classNames({ [classes.disabledButton]: isPending })}
      disabled={isPending}
      onClick={() => {
        if (!isPending) {
          sendFriendRequest({ setMutationError, userId, isPending });
        }
      }}
      loading={isLoading}
    >
      {isPending ? PENDING : ADD_FRIEND}
    </Button>
  );
}
