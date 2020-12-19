import { makeStyles } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useHistory, useLocation } from "react-router-dom";
import { loginPasswordRoute, signupRoute } from "../../../AppRoutes";
import Button from "../../../components/Button";
import TextBody from "../../../components/TextBody";
import TextField from "../../../components/TextField";
import { LoginRes } from "../../../pb/auth_pb";
import { service } from "../../../service";
import { useAuthContext } from "../AuthProvider";

const useStyles = makeStyles({
  signUpButton: {
    textDecoration: "none",
  },
});

export default function UsernameForm() {
  const classes = useStyles();
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { handleSubmit, register, setValue } = useForm<{ username: string }>();
  //this username state in the location is in case the back button was pressed from
  //the password form, to avoid re-entering the username
  const location = useLocation<{ username?: string }>();
  const history = useHistory();

  useEffect(() => {
    if (location.state?.username) {
      setValue("username", location.state.username);
    }
  });

  const onSubmit = handleSubmit(async (data: { username: string }) => {
    setLoading(true);
    authActions.clearError();
    try {
      const next = await service.auth.checkUsername(data.username);
      switch (next) {
        case LoginRes.LoginStep.INVALID_USER:
          authActions.authError("Couldn't find that user.");
          break;

        case LoginRes.LoginStep.NEED_PASSWORD:
          history.push(loginPasswordRoute, data);
          //return here to avoid setLoading when
          //this component is no longer mounted
          return;

        case LoginRes.LoginStep.SENT_LOGIN_EMAIL:
          setSent(true);
          break;
      }
    } catch (e) {
      authActions.authError(e.message);
    }
    setLoading(false);
  });

  if (sent) {
    return <TextBody>Check your email for a link to log in! :)</TextBody>;
  }
  return (
    <>
      <form onSubmit={onSubmit}>
        <TextField
          label="Username/email"
          name="username"
          inputRef={register({ required: true })}
        ></TextField>
        <Button
          onClick={onSubmit}
          loading={loading || authLoading}
          type="submit"
        >
          Next
        </Button>
      </form>
      <Link className={classes.signUpButton} to={signupRoute}>
        <Button>Create an account</Button>
      </Link>
    </>
  );
}
