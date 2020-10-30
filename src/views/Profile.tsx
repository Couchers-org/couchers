import { Button, makeStyles, TextField } from "@material-ui/core";
import React from "react";
import { useForm } from "react-hook-form";
import { updateUser } from "../features/auth";
import { User } from "../pb/api_pb";
import { useAppDispatch, useTypedSelector } from "../store";

const useStyles = makeStyles({
  root: {},
});

export default function Profile() {
  const dispatch = useAppDispatch();
  const user = useTypedSelector((state) => state.auth.user);

  const { register, handleSubmit } = useForm<User.AsObject>();

  const onSubmit = handleSubmit((data: User.AsObject) => {
    dispatch(updateUser(data));
  });

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <h1>Profile</h1>
      <form onSubmit={onSubmit}>
        <div>
          <TextField
            label="Name"
            name={"name"}
            defaultValue={user?.name}
            inputRef={register}
            variant={"outlined"}
            margin="normal"
            fullWidth
          />
        </div>
        <div>
          <TextField
            label="City"
            name={"city"}
            defaultValue={user?.city}
            inputRef={register}
            variant={"outlined"}
            margin="normal"
            fullWidth
          />
        </div>
        <div>
          <TextField
            label="Gender"
            name={"gender"}
            defaultValue={user?.gender}
            inputRef={register}
            variant={"outlined"}
            margin="normal"
            fullWidth
          />
        </div>
        <div>
          <Button variant="contained" color="primary" onClick={onSubmit}>
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
