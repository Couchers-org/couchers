import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useTranslation } from "next-i18next";
import React from "react";

import Button from "@/components/Button";
import { PersonAddIcon } from "@/components/Icons";
import { doAntibot } from "@/features/antibot/antibot";
import { userKey } from "@/features/queryKeys";
import { CONNECTIONS } from "@/i18n/namespaces";
import { User } from "@/proto/api_pb";
import { service } from "@/service";

import { SetMutationError } from ".";

interface AddFriendButtonProps {
  setMutationError: SetMutationError;
  userId: number;
}

const AddFriendButton = ({
  setMutationError,
  userId,
}: AddFriendButtonProps) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation([CONNECTIONS]);
  const { isPending, mutate: sendFriendRequest } = useMutation<
    Empty,
    Error,
    AddFriendButtonProps
  >({
    mutationFn: ({ userId }) => service.api.sendFriendRequest(userId),
    onMutate: async ({ setMutationError }) => {
      setMutationError("");
      await doAntibot("friend_request");

      await queryClient.cancelQueries({
        queryKey: userKey(userId),
      });

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

    onSuccess: async (_, { userId }) => {
      await queryClient.invalidateQueries({
        queryKey: userKey(userId),
      });
    },
  });

  return (
    <Button
      startIcon={<PersonAddIcon />}
      onClick={() => {
        sendFriendRequest({ setMutationError, userId });
      }}
      loading={isPending}
    >
      {t("connections:add_friend")}
    </Button>
  );
};

export default AddFriendButton;
