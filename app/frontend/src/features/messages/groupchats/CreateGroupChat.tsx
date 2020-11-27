import { BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Autocomplete } from "@material-ui/lab";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { User } from "../../../pb/api_pb";
import { service } from "../../../service";
import { useAppDispatch, useTypedSelector } from "../../../store";
import { fetchUsers, getUsers } from "../../userCache";

const useStyles = makeStyles({ root: {} });

export interface GroupChatListProps extends BoxProps {
  createGroupChat: (title: string, users: User.AsObject[]) => void;
}

export function useFindUsers(ids: number[]): User.AsObject[] {
  const notFound: number[] = [];
  const usersRef = useRef<User.AsObject[]>([]);
  const [idsString, setIdsString] = useState<string>("");
  const allUsers = useTypedSelector((state) => getUsers(state));
  const dispatch = useAppDispatch();
  usersRef.current = [];
  const users = usersRef.current;
  for (const id of ids) {
    const user = allUsers[id];
    if (user) {
      users.push(user.user);
    } else {
      notFound.push(id);
    }
  }
  const newIdsString = "" + ids.sort((a, b) => a - b);
  if (newIdsString !== idsString) {
    setIdsString(newIdsString);
    if (notFound.length) {
      dispatch(fetchUsers({ userIds: notFound }));
    }
  }
  return usersRef.current;
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
  const friends = useFindUsers(friendIds);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setFriendIds(await service.api.listFriends());
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
      <Controller
        control={control}
        defaultValue={friends}
        name="users"
        onChange={([, data]: any) => data}
        render={({ onChange }) => (
          <Autocomplete<User.AsObject>
            onChange={(_, value) => {
              onChange(value);
            }}
            multiple={true as any}
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
