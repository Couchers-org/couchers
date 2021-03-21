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
import {
  CREATE,
  ERROR_USER_LOAD,
  FRIENDS,
  NEW_CHAT,
  NEW_GROUP_CHAT,
  TITLE,
} from "features/messages/constants";
import { Error as GrpcError } from "grpc-web";
import { User } from "pb/api_pb";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

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
  const classes = useStyles();

  const [isOpen, setIsOpen] = useState(false);

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
  } = useMutation<number, GrpcError, CreateGroupChatFormData>(
    ({ title, users }) => service.conversations.createGroupChat(title, users),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["groupChats"]);
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
    resetForm();
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
        <ListItemText>{NEW_CHAT}</ListItemText>
      </ListItem>
      <Dialog
        aria-labelledby="create-dialog-title"
        open={isOpen}
        onClose={handleClose}
      >
        <form onSubmit={onSubmit}>
          <DialogTitle id="create-dialog-title">
            {isGroup ? NEW_GROUP_CHAT : NEW_CHAT}
          </DialogTitle>
          <DialogContent>
            {!!errors.length && (
              <Alert severity={"error"}>{errors.join("\n")}</Alert>
            )}
            {isGroup && (
              <TextField
                id="group-chat-title"
                label={TITLE}
                name="title"
                inputRef={register}
                className={classes.field}
              />
            )}
            <Controller
              control={control}
              defaultValue={[]}
              name="users"
              onChange={([, data]: any) => data}
              render={({ onChange }) => (
                <Autocomplete
                  onChange={(_, value) => {
                    onChange(value);
                    setIsGroup(control.getValues().users.length > 1);
                  }}
                  multiple={true}
                  loading={friends.isLoading}
                  options={friends.data ?? []}
                  getOptionLabel={(friend) => {
                    return friend?.name ?? ERROR_USER_LOAD;
                  }}
                  label={FRIENDS}
                  className={classes.field}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={onSubmit}
              loading={isCreateLoading}
            >
              {CREATE}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
