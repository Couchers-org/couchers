import {
  FormControlLabel,
  InputLabel,
  makeStyles,
  Switch,
  Typography,
} from "@material-ui/core";
import Button from "components/Button";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { LoginRes } from "pb/auth_pb";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useHistory } from "react-router-dom";
import { loginPasswordRoute, resetPasswordRoute } from "routes";
import { service } from "service/index";
import { useIsMounted, useSafeState } from "utils/hooks";
import { sanitizeName } from "utils/validation";

const useStyles = makeStyles((theme) => ({
  forgotPasswordLink: {
    color: theme.palette.text.primary,
  },
  loginOptions: {
    alignItems: "center",
    display: "flex",
    marginTop: theme.spacing(2),
  },
}));

export default function UsernameForm() {
  const classes = useStyles();
  const authClasses = useAuthStyles();
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
        const sanitizedUsername = sanitizeName(data.username);
        const next = await service.auth.checkUsername(sanitizedUsername);
        switch (next) {
          case LoginRes.LoginStep.INVALID_USER:
            authActions.authError("Couldn't find that user.");
            break;

          case LoginRes.LoginStep.NEED_PASSWORD:
            history.push(loginPasswordRoute, data);
            setLoginWithLink(false);
            break;

          case LoginRes.LoginStep.SENT_LOGIN_EMAIL:
            setSent(true);
            break;
        }

        if (!loginWithLink) {
          authActions.passwordLogin({
            password: data.password,
            username: sanitizedUsername,
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
      {sent && (
        <TextBody className={authClasses.feedbackMessage}>
          Check your email for a link to log in! :)
        </TextBody>
      )}
      <form className={authClasses.form} onSubmit={onSubmit}>
        <InputLabel className={authClasses.formLabel} htmlFor="username">
          Email/Username
        </InputLabel>
        <TextField
          disabled={sent}
          fullWidth
          id="username"
          inputRef={register({ required: true })}
          name="username"
          variant="standard"
        />
        {!loginWithLink && (
          <>
            <InputLabel className={authClasses.formLabel} htmlFor="password">
              Password
            </InputLabel>
            <TextField
              fullWidth
              id="password"
              name="password"
              inputRef={register({ required: true })}
              type="password"
              variant="standard"
            />
          </>
        )}
        <Button
          classes={{
            label: authClasses.buttonText,
            root: authClasses.button,
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

        <div className={classes.loginOptions}>
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
        </div>
      </form>
    </>
  );
}
