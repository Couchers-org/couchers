import {
  FormControlLabel,
  InputLabel,
  Switch,
  Typography,
} from "@material-ui/core";
import * as Sentry from "@sentry/react";
import Button from "components/Button";
import { ERROR_INFO_FATAL } from "components/ErrorFallback/constants";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import { LoginRes } from "couchers-core/src/proto/auth_pb";
import { service } from "couchers-core/dist/service";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { resetPasswordRoute } from "routes";
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
  forgotPasswordLink: {
    color: theme.palette.text.primary,
  },
  loginOptions: {
    alignItems: "center",
    display: "flex",
    marginTop: theme.spacing(2),
    [theme.breakpoints.up("md")]: {
      justifyContent: "space-between",
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
        Sentry.captureException(e, {
          tags: {
            featureArea: "auth/login",
          },
        });
        authActions.authError(
          e instanceof Error ? e.message : ERROR_INFO_FATAL
        );
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
            style={{ marginLeft: "0px" }}
            control={<Switch size="small" />}
            label={REMEMBER_ME}
          />
          {!loginWithLink && (
            <Typography
              className={classes.forgotPasswordLink}
              variant="body1"
              component={Link}
              to={resetPasswordRoute}
            >
              {FORGOT_PASSWORD}
            </Typography>
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
