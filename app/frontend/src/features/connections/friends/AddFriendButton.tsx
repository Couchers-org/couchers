import Button from "components/Button";
import { PersonAddIcon } from "components/Icons";
import { ADD_FRIEND } from "features/connections/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { User } from "proto/api_pb";
import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

import { SetMutationError } from ".";

interface AddFriendButtonProps {
  setMutationError: SetMutationError;
  userId: number;
}

export default function AddFriendButton({
  setMutationError,
  userId,
}: AddFriendButtonProps) {
  const queryClient = useQueryClient();

  const { isLoading, mutate: sendFriendRequest } = useMutation<
    Empty,
    Error,
    AddFriendButtonProps
  >(({ userId }) => service.api.sendFriendRequest(userId), {
    onMutate: async ({ setMutationError }) => {
      setMutationError("");

      await queryClient.cancelQueries(["user", userId]);

      const cachedUser = queryClient.getQueryData<User.AsObject>([
        "user",
        userId,
      ]);

      if (cachedUser) {
        queryClient.setQueryData<User.AsObject>(["user", userId], {
          ...cachedUser,
          friends: User.FriendshipStatus.PENDING,
        });
      }
      return cachedUser;
    },
    onError: (error, { setMutationError }, cachedUser) => {
      setMutationError(error.message);
      if (cachedUser) {
        queryClient.setQueryData(["user", userId], cachedUser);
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries(["user", userId]);
    },
  });

  return (
    <Button
      startIcon={<PersonAddIcon />}
      onClick={() => {
        sendFriendRequest({ setMutationError, userId });
      }}
      loading={isLoading}
    >
      {ADD_FRIEND}
    </Button>
  );
}
