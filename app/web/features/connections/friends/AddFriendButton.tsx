import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "components/Button";
import { PersonAddIcon } from "components/Icons";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import { doAntibot } from "features/antibot/antibot";
import useAccountInfo from "features/auth/useAccountInfo";
import { userKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { CONNECTIONS } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { User } from "proto/api_pb";
import React, { useState } from "react";
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
  const [showCantFriendDialog, setShowCantFriendDialog] =
    useState<boolean>(false);

  const { data: accountInfo, isLoading: isAccountInfoLoading } =
    useAccountInfo();

  const { isPending, mutate: sendFriendRequest } = useMutation<
    Empty,
    Error,
    AddFriendButtonProps
  >({
    mutationFn: ({ userId }) => service.api.sendFriendRequest(userId),
    onMutate: async ({ setMutationError }) => {
      setMutationError("");
      doAntibot("friend_request");

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

    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: userKey(userId),
      });
    },
  });

  const onClick = () => {
    if (!accountInfo?.profileComplete) {
      setShowCantFriendDialog(true);
    } else {
      sendFriendRequest({ setMutationError, userId });
    }
  };

  return (
    <>
      <ProfileIncompleteDialog
        open={showCantFriendDialog}
        onClose={() => setShowCantFriendDialog(false)}
        attempted_action="send_friend_request"
      />
      <Button
        startIcon={<PersonAddIcon />}
        onClick={onClick}
        loading={isPending}
        disabled={isAccountInfoLoading}
      >
        {t("connections:add_friend")}
      </Button>
    </>
  );
}
