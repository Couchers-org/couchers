import { ListItem, ListItemAvatar, ListItemText } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Alert from "components/Alert";
import Autocomplete from "components/Autocomplete";
import Avatar from "components/Avatar";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import { AddIcon } from "components/Icons";
import TextField from "components/TextField";
import useFriendList from "features/connections/friends/useFriendList";
import { groupChatsListKey } from "features/queryKeys";
import useUserByUsername from "features/userQueries/useUserByUsername";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { useRouter } from "next/router";
import { User } from "proto/api_pb";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";
import stringOrFirstString from "utils/stringOrFirstString";

const useStyles = makeStyles((theme) => ({
  field: {
    marginTop: theme.spacing(1),
    "& .MuiInputBase-root": {
      width: "100%",
    },
  },
}));

interface CreateGroupChatFormData {
  title: string;
  users: User.AsObject[];
}

export default function CreateGroupChat({ className }: { className?: string }) {
  const { t } = useTranslation([GLOBAL, MESSAGES]);
  const classes = useStyles();

  //handle redirects which want to create a new message with someone
  const router = useRouter();
  const createMessageToUsername = stringOrFirstString(router.query.to);
  const [isOpen, setIsOpen] = useState(!!createMessageToUsername);
  const createMessageToUserQuery = useUserByUsername(
    createMessageToUsername ?? ""
  );

  const friends = useFriendList();
  const {
    control,
    register,
    handleSubmit,
    reset: resetForm,
  } = useForm<CreateGroupChatFormData>();

  const queryClient = useQueryClient();
  const {
    mutate: createGroupChat,
    isLoading: isCreateLoading,
    error: createError,
    reset: resetMutationStatus,
  } = useMutation<number, RpcError, CreateGroupChatFormData>(
    ({ title, users }) => service.conversations.createGroupChat(title, users),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(groupChatsListKey);
        resetForm();
        setIsOpen(false);
      },
    }
  );

  const onSubmit = handleSubmit(({ title, users }: CreateGroupChatFormData) =>
    createGroupChat({ title, users })
  );

  const handleClose = () => {
    setIsOpen(false);
    resetMutationStatus();
  };

  const errors = [...friends.errors];
  if (createError) errors.push(createError.message);

  const [isGroup, setIsGroup] = useState(false);

  return (
    <>
      <ListItem button onClick={() => setIsOpen(true)} className={className}>
        <ListItemAvatar>
          <Avatar>
            <AddIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText>{t("messages:create_chat.group_title")}</ListItemText>
      </ListItem>
      <Dialog
        aria-labelledby="create-dialog-title"
        open={isOpen}
        onClose={handleClose}
        keepMounted={
          //prevents the form state being lost
          true
        }
      >
        <form onSubmit={onSubmit}>
          <DialogTitle id="create-dialog-title">
            {isGroup
              ? t("messages:create_chat.group_title")
              : t("messages:create_chat.dm_title")}
          </DialogTitle>
          <DialogContent>
            {!!errors.length && (
              <Alert severity={"error"}>{errors.join("\n")}</Alert>
            )}
            {isGroup && (
              <TextField
                id="group-chat-title"
                label={t("global:title")}
                name="title"
                inputRef={register}
                className={classes.field}
              />
            )}
            {createMessageToUserQuery.error && (
              <Alert severity="error">{createMessageToUserQuery.error}</Alert>
            )}
            {
              // need to mount the autocomplete with the correct default value
              // of the "to" user, display a dummy loader until then
              !createMessageToUserQuery.isLoading ? (
                <Controller
                  control={control}
                  name="users"
                  defaultValue={
                    createMessageToUserQuery.data
                      ? [createMessageToUserQuery.data]
                      : []
                  }
                  render={({ onChange, value }) => {
                    return (
                      <Autocomplete
                        id="users-autocomplete"
                        onChange={(_, newValue) => {
                          onChange(newValue);
                          setIsGroup((newValue?.length ?? 0) > 1);
                        }}
                        multiple={true}
                        loading={friends.isLoading}
                        options={friends.data ?? []}
                        noOptionsText={t(
                          "messages:create_chat.no_friends_found_message"
                        )}
                        getOptionLabel={(friend) => {
                          return (
                            friend?.name ??
                            t("messages:create_chat.user_load_error_message")
                          );
                        }}
                        label={t("messages:create_chat.friends_input_label")}
                        className={classes.field}
                        value={value ?? []}
                      />
                    );
                  }}
                />
              ) : (
                <Autocomplete
                  id="loading-users-autocomplete"
                  loading
                  multiple
                  options={[]}
                  label={t("messages:create_chat.friends_input_label")}
                  value={[]}
                />
              )
            }
          </DialogContent>
          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={onSubmit}
              loading={isCreateLoading}
            >
              {t("global:create")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
