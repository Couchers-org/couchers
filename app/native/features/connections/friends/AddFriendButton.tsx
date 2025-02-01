import Button from "components/Button";
import { userKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { CONNECTIONS } from "i18n/namespaces";
import { User } from "proto/api_pb";
import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation([CONNECTIONS]);
  const { isLoading, mutate: sendFriendRequest } = useMutation<
    Empty,
    Error,
    AddFriendButtonProps
  >(({ userId }) => service.api.sendFriendRequest(userId), {
    onMutate: async ({ setMutationError }) => {
      setMutationError("");

      await queryClient.cancelQueries(userKey(userId));

      const cachedUser = queryClient.getQueryData<User.AsObject>(
        userKey(userId),
      );

      if (cachedUser) {
        queryClient.setQueryData<User.AsObject>(userKey(userId), {
          ...cachedUser,
          friends: User.FriendshipStatus.PENDING,
        });
      }
      return cachedUser;
    },

    onError: (error, { setMutationError }, cachedUser) => {
      setMutationError(error.message);
      if (cachedUser) {
        queryClient.setQueryData(userKey(userId), cachedUser);
      }
    },

    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries(userKey(userId));
    },
  });
  return (
    <Button
      title={t("connections:add_friend")}
      onPress={() => {
        sendFriendRequest({ setMutationError, userId });
      }}
      loading={isLoading}
      style={{ width: 120 }}
    />
  );
}
