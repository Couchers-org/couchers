import { makeStyles } from "@material-ui/core/styles";
import React from "react";
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

const useStyles = makeStyles({ root: {} });

interface CreateGroupChatFormData {
  title: string;
  users: User.AsObject[];
}

export default function CreateGroupChat() {
  const classes = useStyles();

  const friends = useFriendList();
  const { control, register, handleSubmit } = useForm<
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
      },
    }
  );

  const onSubmit = handleSubmit(({ title, users }: CreateGroupChatFormData) =>
    createGroupChat({ title, users })
  );

  const errors = [...friends.errors];
  if (createError) errors.push(createError.message);

  return (
    <form onSubmit={onSubmit}>
      {!!errors.length && <Alert severity={"error"}>{errors.join("\n")}</Alert>}
      <TextField label="Title" name="title" inputRef={register} />
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
          />
        )}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={onSubmit}
        loading={isCreateLoading}
      >
        New
      </Button>
    </form>
  );
}
