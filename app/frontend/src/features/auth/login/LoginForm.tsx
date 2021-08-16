import {
  FormControlLabel,
  InputLabel,
  Link as MuiLink,
  Switch,
} from "@material-ui/core";
import Button from "components/Button";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { LoginRes } from "proto/auth_pb";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { resetPasswordRoute } from "routes";
import { service } from "service";
import { useIsMounted, useSafeState } from "utils/hooks";
import makeStyles from "utils/makeStyles";
import { lowercaseAndTrimField } from "utils/validation";

import {
  CHECK_EMAIL,
  CONTINUE,
  EMAIL_USERNAME,
  FORGOT_PASSWORD,
  PASSWORD,
  REMEMBER_ME,
} from "./constants";

const useStyles = makeStyles((theme) => ({
  rememberSwitch: {
    display: "block",
    marginInlineStart: 0,
    [theme.breakpoints.down("sm")]: {
      marginBlockEnd: theme.spacing(1),
    },
  },
  loginOptions: {
    [theme.breakpoints.up("md")]: {
      alignItems: "center",
      display: "flex",
      marginTop: theme.spacing(2),
      justifyContent: "space-between",
      width: "100%",
    },
  },
}));

export default function LoginForm() {
  const classes = useStyles();
  const authClasses = useAuthStyles();
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useSafeState(useIsMounted(), false);
  const [loginWithLink, setLoginWithLink] = useState(true);

  const { handleSubmit, register } = useForm<{ username: string }>();

  const onSubmit = handleSubmit(
    async (data: { username: string; password: string }) => {
      setLoading(true);
      authActions.clearError();
      try {
        const sanitizedUsername = lowercaseAndTrimField(data.username);
        const next = await service.auth.checkUsername(sanitizedUsername);
        switch (next) {
          case LoginRes.LoginStep.NEED_PASSWORD:
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
          {CHECK_EMAIL}
        </TextBody>
      )}
      <form className={authClasses.form} onSubmit={onSubmit}>
        <InputLabel className={authClasses.formLabel} htmlFor="username">
          {EMAIL_USERNAME}
        </InputLabel>
        <TextField
          className={authClasses.formField}
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
              {PASSWORD}
            </InputLabel>
            <TextField
              className={authClasses.formField}
              fullWidth
              id="password"
              name="password"
              inputRef={(inputElement) => {
                if (inputElement) {
                  inputElement.focus();
                }
                register(inputElement, { required: true });
              }}
              type="password"
              variant="standard"
            />
          </>
        )}
        <div className={classes.loginOptions}>
          <FormControlLabel
            className={classes.rememberSwitch}
            control={<Switch size="small" />}
            label={REMEMBER_ME}
          />
          {!loginWithLink && (
            <MuiLink variant="body2" component={Link} to={resetPasswordRoute}>
              {FORGOT_PASSWORD}
            </MuiLink>
          )}
        </div>
        <Button
          classes={{
            label: authClasses.buttonText,
          }}
          className={authClasses.button}
          disabled={sent}
          loading={loading || authLoading}
          onClick={onSubmit}
          type="submit"
          variant="contained"
        >
          {CONTINUE}
        </Button>
      </form>
    </>
  );
}
