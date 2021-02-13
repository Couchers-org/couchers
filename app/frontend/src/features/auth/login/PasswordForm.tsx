import { makeStyles } from "@material-ui/core";
import React from "react";
import { useForm } from "react-hook-form";
import { Link, Redirect, useHistory, useLocation } from "react-router-dom";

import { loginRoute, resetPasswordRoute } from "../../../AppRoutes";
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { useAuthContext } from "../AuthProvider";

const useStyles = makeStyles((theme) => ({
  button: {
    "& + &": {
      marginInlineStart: theme.spacing(1),
    },
  },
  forgotPasswordLink: {
    ...theme.typography.body1,
    color: "inherit",
    display: "block",
    marginBlockStart: theme.spacing(2),
    marginBlockEnd: theme.spacing(2),
  },
  textField: {
    marginBlockStart: theme.spacing(1),
  },
}));

export default function PasswordForm() {
  const classes = useStyles();
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;

  const { handleSubmit, register } = useForm<{ password: string }>();
  const history = useHistory();
  const location = useLocation<{ username: string }>();

  const onSubmit = handleSubmit(async (data: { password: string }) => {
    authActions.passwordLogin({
      username: location.state.username,
      password: data.password,
    });
  });

  const backClicked = () => {
    authActions.clearError();
    history.push(loginRoute, location.state);
  };

  return (
    <>
      {!location.state.username && <Redirect to={loginRoute} />}
      <form onSubmit={onSubmit}>
        <TextField
          className={classes.textField}
          id="email"
          label="Username/email"
          value={location.state.username}
          disabled
        ></TextField>
        <TextField
          className={classes.textField}
          id="password"
          label="Password"
          name="password"
          inputRef={register({ required: true })}
          type="password"
        ></TextField>
        <Link to={resetPasswordRoute} className={classes.forgotPasswordLink}>
          Forgot password?
        </Link>
        <Button className={classes.button} onClick={backClicked}>
          Back
        </Button>
        <Button
          className={classes.button}
          onClick={onSubmit}
          loading={authLoading}
          type="submit"
        >
          Log in
        </Button>
      </form>
    </>
  );
}
