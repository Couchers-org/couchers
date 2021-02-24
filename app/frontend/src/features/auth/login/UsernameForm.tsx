import { Box, makeStyles } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useHistory, useLocation } from "react-router-dom";

import Button from "../../../components/Button";
import TextBody from "../../../components/TextBody";
import TextField from "../../../components/TextField";
import { LoginRes } from "../../../pb/auth_pb";
import { loginPasswordRoute, signupRoute } from "../../../routes";
import { service } from "../../../service";
import { useIsMounted, useSafeState } from "../../../utils/hooks";
import { useAuthContext } from "../AuthProvider";

const useStyles = makeStyles((theme) => ({
  signUpButton: {
    textDecoration: "none",
  },
  submitRow: {
    display: "flex",
    alignItems: "center",
  },
  button: {
    marginInlineEnd: theme.spacing(1),
  },
}));

export default function UsernameForm() {
  const classes = useStyles();
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useSafeState(useIsMounted(), false);

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

  return (
    <>
      <form onSubmit={onSubmit}>
        <TextField
          id="username-email"
          label="Username/email"
          name="username"
          inputRef={register({ required: true })}
          disabled={sent}
        />
        <Box className={classes.submitRow}>
          <Button
            onClick={onSubmit}
            loading={loading || authLoading}
            disabled={sent}
            className={classes.button}
            type="submit"
          >
            Next
          </Button>
          {sent && (
            <TextBody>Check your email for a link to log in! :)</TextBody>
          )}
        </Box>
      </form>
      <Link className={classes.signUpButton} to={signupRoute}>
        <Button>Create an account</Button>
      </Link>
    </>
  );
}
