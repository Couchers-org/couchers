import {
  CircularProgress,
  DialogProps,
  List,
  ListItem,
} from "@material-ui/core";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import Button from "components/Button";
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
import { useMembersDialogStyles } from "features/messages/chats/MembersDialog";
import useUsers from "features/userQueries/useUsers";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { User } from "proto/api_pb";
import { Chat } from "proto/conversations_pb";
import { chatKey, chatMessagesKey, chatsListKey } from "queryKeys";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

function AdminListItem({
  chatId,
  member,
  memberIsAdmin,
  setError,
}: {
  chatId: number;
  member: User.AsObject;
  memberIsAdmin: boolean;
  setError: (value: string) => void;
}) {
  const classes = useMembersDialogStyles();

  const isCurrentUser = useAuthContext().authState.userId === member.userId;

  const queryClient = useQueryClient();
  const clearError = () => setError("");
  const handleError = (error: GrpcError) => setError(error.message);
  const invalidate = () => {
    queryClient.invalidateQueries(chatMessagesKey(chatId));
    queryClient.invalidateQueries(chatsListKey);
    queryClient.invalidateQueries(chatKey(chatId));
  };

  const makeAdmin = useMutation<Empty, GrpcError, void>(
    () => service.conversations.makeChatAdmin(chatId, member),
    {
      onError: handleError,
      onMutate: clearError,
      onSuccess: () => {
        const previousChat = queryClient.getQueryData<Chat.AsObject>([
          "chat",
          chatId,
        ]);
        const newAdminUserIdsList = Array.from(
          previousChat?.adminUserIdsList ?? []
        );
        newAdminUserIdsList.push(member.userId);
        queryClient.setQueryData(chatKey(chatId), {
          ...previousChat,
          adminUserIdsList: newAdminUserIdsList,
        });
        invalidate();
      },
    }
  );
  const removeAdmin = useMutation<Empty, GrpcError, void>(
    () => service.conversations.removeChatAdmin(chatId, member),
    {
      onError: handleError,
      onMutate: clearError,
      onSuccess: () => {
        const previousChat = queryClient.getQueryData<Chat.AsObject>(
          chatKey(chatId)
        );
        const newAdminUserIdsList = Array.from(
          previousChat?.adminUserIdsList ?? []
        );
        newAdminUserIdsList.splice(
          newAdminUserIdsList.indexOf(member.userId),
          1
        );
        queryClient.setQueryData(chatKey(chatId), {
          ...previousChat,
          adminUserIdsList: newAdminUserIdsList,
        });
        invalidate();
      },
    }
  );

  const handleMakeAdmin = () => makeAdmin.mutate();
  const handleRemoveAdmin = () => removeAdmin.mutate();

  return (
    <ListItem dense className={classes.memberListItemContainer}>
      {
        //TODO: Colours
        memberIsAdmin ? (
          isCurrentUser ? (
            <ConfirmationDialogWrapper
              title="Step down as admin?"
              message={
                `Are you sure you want to stop being an admin ` +
                `of this group chat? You will not be able to become ` +
                `an admin again unless another admin adds you.`
              }
              onConfirm={handleRemoveAdmin}
            >
              {(setIsOpen) => (
                <IconButton
                  aria-label="Remove as admin"
                  size="small"
                  loading={removeAdmin.isLoading}
                  onClick={() => setIsOpen(true)}
                >
                  <CloseIcon />
                </IconButton>
              )}
            </ConfirmationDialogWrapper>
          ) : (
            <IconButton
              aria-label="Remove as admin"
              size="small"
              loading={removeAdmin.isLoading}
              onClick={handleRemoveAdmin}
            >
              <CloseIcon />
            </IconButton>
          )
        ) : (
          <IconButton
            aria-label="Add as admin"
            size="small"
            loading={makeAdmin.isLoading}
            onClick={handleMakeAdmin}
          >
            <AddIcon />
          </IconButton>
        )
      }
      <Avatar user={member} className={classes.avatar} />
      <TextBody noWrap>{member.name}</TextBody>
    </ListItem>
  );
}

interface AdminsDialogProps extends DialogProps {
  chat?: Chat.AsObject;
}

export default function AdminsDialog({ chat, ...props }: AdminsDialogProps) {
  const [error, setError] = useState("");

  const nonAdminIds = chat?.memberUserIdsList.filter(
    (id) => !chat?.adminUserIdsList.includes(id)
  );

  const currentUserId = useAuthContext().authState.userId;
  const admins = useUsers(chat?.adminUserIdsList ?? []);
  const nonAdmins = useUsers(nonAdminIds ?? []);
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
      <DialogTitle id="admins-dialog-title">Remove Admin</DialogTitle>
      <DialogContent>
        <List>
          {admins.isLoading ? (
            <CircularProgress />
          ) : (
            Array.from(admins.data?.values() ?? [])
              .sort((a, b) => b?.name.localeCompare(a?.name ?? "") ?? 0)
              .map((user) =>
                user ? (
                  <AdminListItem
                    key={`admin-dialog-${user.userId}`}
                    member={user}
                    memberIsAdmin={
                      chat?.adminUserIdsList.includes(user.userId) ?? false
                    }
                    chatId={chat?.chatId ?? 0}
                    setError={setError}
                  />
                ) : null
              )
          )}
        </List>
      </DialogContent>
      {nonAdminIds?.length !== 0 && (
        <>
          <DialogTitle id="admins-dialog-title">Add Admin</DialogTitle>

          <DialogContent>
            <List>
              {nonAdmins.isLoading ? (
                <CircularProgress />
              ) : (
                Array.from(nonAdmins.data?.values() ?? [])
                  .sort((a, b) => b?.name.localeCompare(a?.name ?? "") ?? 0)
                  .map((user) =>
                    user ? (
                      <AdminListItem
                        key={`admin-dialog-${user.userId}`}
                        member={user}
                        memberIsAdmin={
                          chat?.adminUserIdsList.includes(user.userId) ?? false
                        }
                        chatId={chat?.chatId ?? 0}
                        setError={setError}
                      />
                    ) : null
                  )
              )}
            </List>
          </DialogContent>
        </>
      )}
      <DialogActions>
        <Button onClick={() => (onClose ? onClose({}, "escapeKeyDown") : null)}>
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
}
