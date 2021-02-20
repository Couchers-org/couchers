import {
  Box,
  FormControlLabel,
  InputLabel,
  makeStyles,
  Switch,
  TextField as MuiTextField,
  Typography,
} from "@material-ui/core";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useHistory } from "react-router-dom";

import Button from "../../../components/Button";
import TextBody from "../../../components/TextBody";
import { LoginRes } from "../../../pb/auth_pb";
import { loginPasswordRoute, resetPasswordRoute } from "../../../routes";
import { service } from "../../../service";
import { useIsMounted, useSafeState } from "../../../utils/hooks";
import { useAuthContext } from "../AuthProvider";

const useStyles = makeStyles((theme) => ({
  loginForm: {
    display: "flex",
    flexDirection: "column",
    marginBottom: theme.spacing(5),
    width: "100%",
  },
  formField: {},
  formLabel: {
    color: "#333333",
    fontWeight: 700,
  },
  button: {
    marginTop: theme.spacing(4),
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: 700,
  },
  loginOptions: {
    display: "flex",
    marginTop: theme.spacing(2),
  },
  forgotPasswordLink: {
    color: "#333333",
    lineHeight: theme.spacing(5),
  },
}));

export default function UsernameForm() {
  const classes = useStyles();
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useSafeState(useIsMounted(), false);
  const [loginWithLink, setLoginWithLink] = useState(true);

  const { handleSubmit, register } = useForm<{ username: string }>();
  const history = useHistory();

  const onSubmit = handleSubmit(
    async (data: { username: string; password: string }) => {
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
            setLoginWithLink(false);
            return;

          case LoginRes.LoginStep.SENT_LOGIN_EMAIL:
            setSent(true);
            break;
        }

        if (!loginWithLink) {
          authActions.passwordLogin({
            username: data.username,
            password: data.password,
          });
        }
      } catch (e) {
        authActions.authError(e.message);
      }
      setLoading(false);
    }
  );

  return (
    <>
      {sent && <TextBody>Check your email for a link to log in! :)</TextBody>}
      <form className={classes.loginForm} onSubmit={onSubmit}>
        <InputLabel className={classes.formLabel} htmlFor="email">
          Email
        </InputLabel>
        <MuiTextField
          id="email"
          className={classes.formField}
          label="name@sample.com"
          name="email"
          inputRef={register({ required: true })}
          disabled={sent}
        />
        {!loginWithLink && (
          <>
            <InputLabel className={classes.formLabel} htmlFor="password">
              Password
            </InputLabel>
            <MuiTextField
              className={classes.formField}
              id="password"
              label="Enter your password"
              name="password"
              inputRef={register({ required: true })}
              type="password"
            />
          </>
        )}
        <Button
          classes={{
            root: classes.button,
            label: classes.buttonText,
          }}
          type="submit"
          variant="contained"
          color="secondary"
          onClick={onSubmit}
          disabled={sent}
          loading={loading || authLoading}
        >
          Continue
        </Button>

        <Box className={classes.loginOptions}>
          <FormControlLabel
            style={{ marginLeft: "0px" }}
            control={<Switch size="small" />}
            label="Remember me"
          />
          <Typography
            className={classes.forgotPasswordLink}
            variant="body1"
            component={Link}
            to={resetPasswordRoute}
          >
            Forgot password?
          </Typography>
        </Box>
      </form>
    </>
  );
}
