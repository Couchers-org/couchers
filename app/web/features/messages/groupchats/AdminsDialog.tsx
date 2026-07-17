import { DialogProps, List, ListItem, styled } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import ConfirmationDialogWrapper from "components/ConfirmationDialogWrapper";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import IconButton from "components/IconButton";
import { AddIcon, CloseIcon } from "components/Icons";
import TextBody from "components/TextBody";
import { useAuthContext } from "features/auth/AuthProvider";
import {
  groupChatKey,
  groupChatMessagesKey,
  groupChatsListKey,
} from "features/queryKeys";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { GroupChat } from "proto/conversations_pb";
import React, { useEffect, useState } from "react";
import { service } from "service";
import { theme } from "theme";

const StyledAvatar = styled(Avatar)(() => ({
  height: 30,
  marginInlineEnd: theme.spacing(1),
  width: 30,
}));

const StyledMemberListItemContainer = styled(ListItem)(() => ({
  alignItems: "center",
  display: "flex",
  justifyContent: "flex-start",
}));

function AdminListItem({
  groupChatId,
  member,
  memberIsAdmin,
  setError,
}: {
  groupChatId: number;
  member: LiteUser.AsObject;
  memberIsAdmin: boolean;
  setError: (value: string) => void;
}) {
  const { t } = useTranslation(MESSAGES);

  const isCurrentUser = useAuthContext().authState.userId === member.userId;

  const queryClient = useQueryClient();
  const clearError = () => setError("");
  const handleError = (error: RpcError) => setError(error.message);
  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: [groupChatMessagesKey(groupChatId)],
    });
    queryClient.invalidateQueries({
      queryKey: [groupChatsListKey],
    });
    queryClient.invalidateQueries({
      queryKey: [groupChatKey(groupChatId)],
    });
  };

  const makeAdmin = useMutation({
    mutationFn: () =>
      service.conversations.makeGroupChatAdmin(groupChatId, member),
    onError: handleError,
    onMutate: clearError,

    onSuccess: () => {
      const previousGroupChat = queryClient.getQueryData<GroupChat.AsObject>([
        "groupChat",
        groupChatId,
      ]);
      const newAdminUserIdsList = Array.from(
        previousGroupChat?.adminUserIdsList ?? [],
      );
      newAdminUserIdsList.push(member.userId);
      queryClient.setQueryData(groupChatKey(groupChatId), {
        ...previousGroupChat,
        adminUserIdsList: newAdminUserIdsList,
      });
      invalidate();
    },
  });
  const removeAdmin = useMutation({
    mutationFn: () =>
      service.conversations.removeGroupChatAdmin(groupChatId, member),
    onError: handleError,
    onMutate: clearError,

    onSuccess: () => {
      const previousGroupChat = queryClient.getQueryData<GroupChat.AsObject>(
        groupChatKey(groupChatId),
      );
      const newAdminUserIdsList = Array.from(
        previousGroupChat?.adminUserIdsList ?? [],
      );
      newAdminUserIdsList.splice(newAdminUserIdsList.indexOf(member.userId), 1);
      queryClient.setQueryData(groupChatKey(groupChatId), {
        ...previousGroupChat,
        adminUserIdsList: newAdminUserIdsList,
      });
      invalidate();
    },
  });

  const handleMakeAdmin = () => makeAdmin.mutate();
  const handleRemoveAdmin = () => removeAdmin.mutate();

  return (
    <StyledMemberListItemContainer dense>
      {
        //TODO: Colours
        memberIsAdmin ? (
          isCurrentUser ? (
            <ConfirmationDialogWrapper
              title={t("admins_dialog.step_down_confirmation_dialog.title")}
              message={t("admins_dialog.step_down_confirmation_dialog.message")}
              onConfirm={handleRemoveAdmin}
            >
              {(setIsOpen) => (
                <IconButton
                  aria-label={t("admins_dialog.remove_admin.action_a11y_label")}
                  size="small"
                  loading={removeAdmin.isPending}
                  onClick={() => setIsOpen(true)}
                >
                  <CloseIcon />
                </IconButton>
              )}
            </ConfirmationDialogWrapper>
          ) : (
            <IconButton
              aria-label={t("admins_dialog.remove_admin.action_a11y_label")}
              size="small"
              loading={removeAdmin.isPending}
              onClick={handleRemoveAdmin}
            >
              <CloseIcon />
            </IconButton>
          )
        ) : (
          <IconButton
            aria-label={t("admins_dialog.add_admin.action_a11y_label")}
            size="small"
            loading={makeAdmin.isPending}
            onClick={handleMakeAdmin}
          >
            <AddIcon />
          </IconButton>
        )
      }
      <StyledAvatar user={member} />
      <TextBody noWrap>{member.name}</TextBody>
    </StyledMemberListItemContainer>
  );
}

interface AdminsDialogProps extends DialogProps {
  groupChat?: GroupChat.AsObject;
}

export default function AdminsDialog({
  groupChat,
  ...props
}: AdminsDialogProps) {
  const { t, i18n } = useTranslation([GLOBAL, MESSAGES]);
  const [error, setError] = useState("");

  const nonAdminIds = groupChat?.memberUserIdsList.filter(
    (id) => !groupChat?.adminUserIdsList.includes(id),
  );

  const currentUserId = useAuthContext().authState.userId;
  const admins = useLiteUsers(groupChat?.adminUserIdsList ?? []);
  const nonAdmins = useLiteUsers(nonAdminIds ?? []);
  const onClose = props?.onClose;
  const isOpen = props.open;

  useEffect(() => {
    if (admins.data && onClose && isOpen) {
      if (!admins.data.has(currentUserId ?? 0)) {
        onClose({}, "escapeKeyDown");
      }
    }
  }, [admins.data, currentUserId, onClose, isOpen]);

  return (
    <Dialog {...props} aria-labelledby="admins-dialog-title">
      {error && (
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
      )}
      <DialogTitle id="admins-dialog-title">
        {t("messages:admins_dialog.remove_admin.title")}
      </DialogTitle>
      <DialogContent>
        <List>
          {admins.isLoading ? (
            <CenteredSpinner />
          ) : (
            Array.from(admins.data?.values() ?? [])
              .sort(
                (a, b) =>
                  b?.name.localeCompare(a?.name ?? "", i18n.language) ?? 0,
              )
              .map((user) =>
                user ? (
                  <AdminListItem
                    key={`admin-dialog-${user.userId}`}
                    member={user}
                    memberIsAdmin={
                      groupChat?.adminUserIdsList.includes(user.userId) ?? false
                    }
                    groupChatId={groupChat?.groupChatId ?? 0}
                    setError={setError}
                  />
                ) : null,
              )
          )}
        </List>
      </DialogContent>
      {nonAdminIds?.length !== 0 && (
        <>
          <DialogTitle id="admins-dialog-title">
            {t("messages:admins_dialog.add_admin.title")}
          </DialogTitle>

          <DialogContent>
            <List>
              {nonAdmins.isLoading ? (
                <CenteredSpinner />
              ) : (
                Array.from(nonAdmins.data?.values() ?? [])
                  .sort(
                    (a, b) =>
                      b?.name.localeCompare(a?.name ?? "", i18n.language) ?? 0,
                  )
                  .map((user) =>
                    user ? (
                      <AdminListItem
                        key={`admin-dialog-${user.userId}`}
                        member={user}
                        memberIsAdmin={
                          groupChat?.adminUserIdsList.includes(user.userId) ??
                          false
                        }
                        groupChatId={groupChat?.groupChatId ?? 0}
                        setError={setError}
                      />
                    ) : null,
                  )
              )}
            </List>
          </DialogContent>
        </>
      )}
      <DialogActions>
        <Button onClick={() => (onClose ? onClose({}, "escapeKeyDown") : null)}>
          {t("global:ok")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
