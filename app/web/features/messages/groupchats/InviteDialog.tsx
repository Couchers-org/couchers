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
import {
  groupChatKey,
  groupChatMessagesKey,
  groupChatsListKey,
} from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { User } from "proto/api_pb";
import { GroupChat } from "proto/conversations_pb";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

export default function InviteDialog({
  groupChat,
  ...props
}: DialogProps & { groupChat: GroupChat.AsObject }) {
  const friends = useFriendList();
  const { control, handleSubmit } = useForm<{
    selected: User.AsObject[];
  }>();
  const friendsNotInChat = friends.data?.filter(
    (friend) => !groupChat.memberUserIdsList.includes(friend?.userId ?? 0)
  );

  const queryClient = useQueryClient();
  const mutation = useMutation<Empty[], RpcError, User.AsObject[]>(
    (users: User.AsObject[]) =>
      service.conversations.inviteToGroupChat(groupChat.groupChatId, users),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(
          groupChatMessagesKey(groupChat.groupChatId)
        );
        queryClient.invalidateQueries(groupChatsListKey);
        queryClient.invalidateQueries(groupChatKey(groupChat.groupChatId));
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
