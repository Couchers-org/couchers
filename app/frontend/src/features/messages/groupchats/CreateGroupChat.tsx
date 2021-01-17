import { makeStyles } from "@material-ui/core/styles";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { Error as GrpcError } from "grpc-web";
import Alert from "../../../components/Alert";
import Autocomplete from "../../../components/Autocomplete";
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { User } from "../../../pb/api_pb";
import useFriendList from "../../connections/friends/useFriendList";
import { service } from "../../../service";
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@material-ui/core";
import { AddIcon } from "../../../components/Icons";
import Avatar from "../../../components/Avatar";

const useStyles = makeStyles((theme) => ({
  title: { paddingBottom: 0 },
  field: { marginTop: theme.spacing(1) },
  button: {
    display: "block",
    marginInline: "auto",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
}));

interface CreateGroupChatFormData {
  title: string;
  users: User.AsObject[];
}

export default function CreateGroupChat() {
  const classes = useStyles();

  const [isOpen, setIsOpen] = useState(false);

  const friends = useFriendList();
  const { control, register, handleSubmit, reset: resetForm } = useForm<
    CreateGroupChatFormData
  >();

  const queryClient = useQueryClient();
  const {
    mutate: createGroupChat,
    isLoading: isCreateLoading,
    error: createError,
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

  const errors = [...friends.errors];
  if (createError) errors.push(createError.message);

  return (
    <>
      <ListItem button onClick={() => setIsOpen(true)}>
        <ListItemAvatar>
          <Avatar>
            <AddIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText>Create a new group chat</ListItemText>
      </ListItem>
      <Dialog
        aria-labelledby="create-dialog-title"
        open={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <DialogTitle id="create-dialog-title" className={classes.title}>
          Create group chat
        </DialogTitle>
        <DialogContent>
          <form onSubmit={onSubmit}>
            {!!errors.length && (
              <Alert severity={"error"}>{errors.join("\n")}</Alert>
            )}
            <TextField
              label="Title"
              name="title"
              inputRef={register}
              className={classes.field}
            />
            <Controller
              control={control}
              defaultValue={friends}
              name="users"
              onChange={([, data]: any) => data}
              render={({ onChange }) => (
                <Autocomplete
                  onChange={(_, value) => {
                    onChange(value);
                  }}
                  multiple={true}
                  loading={friends.isLoading}
                  options={friends.data ?? []}
                  getOptionLabel={(friend) => {
                    return friend?.name ?? "(User load error)";
                  }}
                  label="Friends"
                  className={classes.field}
                />
              )}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={onSubmit}
              loading={isCreateLoading}
              className={classes.button}
            >
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
