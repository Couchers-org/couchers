import { BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Autocomplete } from "@material-ui/lab";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import CircularProgress from "../../../components/CircularProgress";
import TextField from "../../../components/TextField";
import { User } from "../../../pb/api_pb";
import { service } from "../../../service";
import { useAppDispatch, useTypedSelector } from "../../../store";
import { fetchUsers, getUsers } from "../../userCache";

const useStyles = makeStyles({ root: {} });

export interface GroupChatListProps extends BoxProps {
  createGroupChat: (title: string, users: User.AsObject[]) => void;
}

interface CreateGroupChatFormData {
  title: string;
  users: User.AsObject[];
}

export default function CreateGroupChat({
  createGroupChat,
}: GroupChatListProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [friendIds, setFriendIds] = React.useState<number[]>([]);
  const allUsers = useTypedSelector((state) => getUsers(state));
  const friends = friendIds
    .map((friendId) => allUsers["" + friendId]?.user)
    .filter(Boolean) as User.AsObject[];
  const dispatch = useAppDispatch();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const friendIds = await service.api.listFriends();
        await dispatch(fetchUsers({ userIds: friendIds }));
        setFriendIds(friendIds);
      } catch (error) {
        setError(error.message);
      }
      setLoading(false);
    })();
  }, []);
  const { control, register, handleSubmit } = useForm<
    CreateGroupChatFormData
  >();

  const classes = useStyles();

  const onSubmit = handleSubmit(async (data: CreateGroupChatFormData) => {
    try {
      createGroupChat(data.title, data.users);
    } catch (error) {
      setError(error.message);
    }
  });
  return (
    <form onSubmit={onSubmit}>
      <TextField label="Title" name="title" inputRef={register} />
      {error && <Alert severity={"error"}>{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
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
              options={friends}
              getOptionLabel={(user) => {
                return user.name;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  helperText="Press 'Enter' to add"
                  label="Friends"
                />
              )}
            />
          )}
        />
      )}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={onSubmit}
      >
        New
      </Button>
    </form>
  );
}
