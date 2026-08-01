import { Link } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import { PersonAddIcon } from "components/Icons";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import { User } from "couchers/proto/api_pb";
import { doAntibot } from "features/antibot/antibot";
import useAccountInfo from "features/auth/useAccountInfo";
import { userKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Trans, useTranslation } from "i18n";
import { CONNECTIONS, GLOBAL, PROFILE } from "i18n/namespaces";
import React, { useState } from "react";
import { helpCenterFriendRequestsURL } from "routes";
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
  const { t } = useTranslation([PROFILE, CONNECTIONS, GLOBAL]);
  const [showCantFriendDialog, setShowCantFriendDialog] =
    useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

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
      setShowConfirmDialog(true);
    }
  };

  const onConfirm = () => {
    setShowConfirmDialog(false);
    sendFriendRequest({ setMutationError, userId });
  };

  return (
    <>
      <ProfileIncompleteDialog
        open={showCantFriendDialog}
        onClose={() => setShowCantFriendDialog(false)}
        attempted_action="send_friend_request"
      />
      <Dialog
        aria-labelledby="add-friend-confirm-dialog"
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <DialogTitle id="add-friend-confirm-dialog">
          {t("connections:add_friend_confirmation_dialog.title")}
        </DialogTitle>
        <DialogContent>
          <Trans
            i18nKey="connections:add_friend_confirmation_dialog.message"
            components={{
              helpCenterLink: (
                <Link
                  href={helpCenterFriendRequestsURL}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setShowConfirmDialog(false)}
          >
            {t("global:cancel")}
          </Button>
          <Button variant="contained" loading={isPending} onClick={onConfirm}>
            {t("connections:add_friend_confirmation_dialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
      <Button
        startIcon={<PersonAddIcon />}
        onClick={onClick}
        loading={isPending}
        disabled={isAccountInfoLoading}
      >
        {t("profile:actions.add_friend")}
      </Button>
    </>
  );
}
