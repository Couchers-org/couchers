import { Checkbox, DialogProps, FormControlLabel } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import TextField from "components/TextField";
import {
  groupChatKey,
  groupChatMessagesKey,
  groupChatsListKey,
} from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { GroupChat } from "proto/conversations_pb";
import React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

interface GroupChatSettingsData {
  title: string;
  onlyAdminsInvite: boolean;
}

export default function GroupChatSettingsDialog({
  groupChat,
  ...props
}: DialogProps & { groupChat: GroupChat.AsObject }) {
  const { t } = useTranslation([GLOBAL, MESSAGES]);
  const { register, handleSubmit } = useForm<GroupChatSettingsData>();

  const queryClient = useQueryClient();
  const mutation = useMutation<Empty, RpcError, GroupChatSettingsData>(
    ({ title, onlyAdminsInvite }) =>
      service.conversations.editGroupChat(
        groupChat.groupChatId,
        title,
        onlyAdminsInvite
      ),
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

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data);
  });

  return (
    <Dialog {...props} aria-labelledby="group-chat-settings-dialog-title">
      <DialogTitle id="group-chat-settings-dialog-title">
        {t("messages:group_chat_settings_dialog.title")}
      </DialogTitle>
      <DialogContent>
        <form onSubmit={onSubmit}>
          {mutation.error && (
            <Alert severity={"error"}>{mutation.error?.message}</Alert>
          )}
          <TextField
            id="group-chat-settings-chat-title"
            inputRef={register}
            defaultValue={groupChat.title}
            name="title"
            label={t(
              "messages:group_chat_settings_dialog.chat_title.field_label"
            )}
          />
          <FormControlLabel
            control={
              <Checkbox
                name="onlyAdminsInvite"
                inputRef={register}
                defaultChecked={groupChat.onlyAdminsInvite}
              />
            }
            label={t(
              "messages:group_chat_settings_dialog.only_admins_invite.field_label"
            )}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSubmit} loading={mutation.isLoading}>
          {t("global:save")}
        </Button>
        <Button
          onClick={() =>
            props.onClose ? props.onClose({}, "escapeKeyDown") : null
          }
        >
          {t("global:cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
