import { FormControlLabel, InputLabel, Switch } from "@material-ui/core";
import * as Sentry from "@sentry/nextjs";
import Button from "components/Button";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { useTranslation } from "next-i18next";
import { LoginRes } from "proto/auth_pb";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { resetPasswordRoute } from "routes";
import { service } from "service";
import isGrpcError from "utils/isGrpcError";
import makeStyles from "utils/makeStyles";
import { lowercaseAndTrimField } from "utils/validation";

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
  const { t } = useTranslation(["auth", "global"]);
  const classes = useStyles();
  const authClasses = useAuthStyles();
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
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
          isGrpcError(e) ? e.message : t("global:fatal_error_message")
        );
      }
      setLoading(false);
    }
  );

  return (
    <>
      {sent && (
        <TextBody className={authClasses.feedbackMessage}>
          {t("auth:login_page.form.no_password_login_prompt")}
        </TextBody>
      )}
      <form className={authClasses.form} onSubmit={onSubmit}>
        <InputLabel className={authClasses.formLabel} htmlFor="username">
          {t("auth:login_page.form.username_field_label")}
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
              {t("auth:login_page.form.password_field_label")}
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
            label={t("auth:login_page.form.remember_me")}
          />
          {!loginWithLink && (
            <StyledLink href={resetPasswordRoute}>
              {t("auth:login_page.form.forgot_password")}
            </StyledLink>
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
          {t("global:continue")}
        </Button>
      </form>
    </>
  );
}
