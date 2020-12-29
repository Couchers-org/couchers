import { makeStyles } from "@material-ui/core/styles";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Alert from "../../../components/Alert";
import Autocomplete from "../../../components/Autocomplete";
import Button from "../../../components/Button";
import CircularProgress from "../../../components/CircularProgress";
import TextField from "../../../components/TextField";
import { User } from "../../../pb/api_pb";
import { service } from "../../../service";
import { useAppDispatch } from "../../../store";
import useUsers from "../../userQueries/useUsers";
import { createGroupChat } from "./groupChatsActions";

const useStyles = makeStyles({ root: {} });

interface CreateGroupChatFormData {
  title: string;
  users: User.AsObject[];
}

export default function CreateGroupChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [friendIds, setFriendIds] = React.useState<number[]>([]);
  const {
    data: friends,
    errors: queryErrors,
    isLoading: queryIsLoading,
  } = useUsers(friendIds);
  const dispatch = useAppDispatch();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const friendIds = await service.api.listFriends();
        setFriendIds(friendIds);
      } catch (error) {
        setError(error.message);
      }
      setLoading(false);
    })();
  }, [dispatch]);
  const { control, register, handleSubmit } = useForm<
    CreateGroupChatFormData
  >();

  const classes = useStyles();

  const onSubmit = handleSubmit((data: CreateGroupChatFormData) =>
    dispatch(
      createGroupChat({
        title: data.title,
        users: data.users,
      })
    )
  );
  return (
    <form onSubmit={onSubmit}>
      {(error || !!queryErrors.length) && (
        <Alert severity={"error"}>{[error, ...queryErrors].join("\n")}</Alert>
      )}
      <TextField label="Title" name="title" inputRef={register} />
      {loading || queryIsLoading ? (
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
              options={Array.from(friends!.values())}
              getOptionLabel={(friend) => {
                return friend?.name ?? "(User load error)";
              }}
              label="Friends"
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
