import { DialogProps } from "@material-ui/core";
import Alert from "components/Alert";
import Autocomplete from "components/Autocomplete";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import useFriendList from "features/connections/friends/useFriendList";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { User } from "proto/api_pb";
import { Chat } from "proto/conversations_pb";
import { chatKey, chatMessagesKey, chatsListKey } from "queryKeys";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

export default function InviteDialog({
  chat,
  ...props
}: DialogProps & { chat: Chat.AsObject }) {
  const friends = useFriendList();
  const { control, handleSubmit } = useForm<{
    selected: User.AsObject[];
  }>();
  const friendsNotInChat = friends.data?.filter(
    (friend) => !chat.memberUserIdsList.includes(friend?.userId ?? 0)
  );

  const queryClient = useQueryClient();
  const mutation = useMutation<Empty[], GrpcError, User.AsObject[]>(
    (users: User.AsObject[]) =>
      service.conversations.inviteToChat(chat.chatId, users),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(chatMessagesKey(chat.chatId));
        queryClient.invalidateQueries(chatsListKey);
        queryClient.invalidateQueries(chatKey(chat.chatId));
        if (props.onClose) props.onClose({}, "escapeKeyDown");
      },
    }
  );

  const onSubmit = handleSubmit(({ selected }) => {
    mutation.mutate(selected);
  });

  return (
    <Dialog {...props} aria-labelledby="invite-dialog-title">
      <DialogTitle id="invite-dialog-title">Invite to chat</DialogTitle>
      <DialogContent>
        <form onSubmit={onSubmit}>
          {(mutation.error || !!friends.errors.length) && (
            <Alert severity={"error"}>
              {mutation.error?.message || friends.errors.join("\n")}
            </Alert>
          )}
          <Controller
            control={control}
            defaultValue={[]}
            name="selected"
            render={({ onChange }) => (
              <Autocomplete
                id="selected-autocomplete"
                onChange={(_, value) => {
                  onChange(value);
                }}
                loading={friends.isLoading}
                options={friendsNotInChat ?? []}
                getOptionLabel={(friend) => {
                  return friend?.name ?? "(User load error)";
                }}
                noOptionsText="No one to invite"
                label="Friends"
                multiple={true}
                freeSolo={false}
              />
            )}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSubmit} loading={mutation.isLoading}>
          Invite
        </Button>
        <Button
          onClick={() =>
            props.onClose ? props.onClose({}, "escapeKeyDown") : null
          }
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
