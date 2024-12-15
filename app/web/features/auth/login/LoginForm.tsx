import { FormControlLabel, InputLabel } from "@mui/material";
import Button from "components/Button";
import CustomColorSwitch from "components/CustomColorSwitch";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import Sentry from "platform/sentry";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { resetPasswordRoute } from "routes";
import isGrpcError from "service/utils/isGrpcError";
import makeStyles from "utils/makeStyles";
import { lowercaseAndTrimField } from "utils/validation";

const useStyles = makeStyles((theme) => ({
  rememberSwitch: {
    display: "block",
    marginInlineStart: 0,
    [theme.breakpoints.down("md")]: {
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
  const { t } = useTranslation([AUTH, GLOBAL]);
  const classes = useStyles();
  const authClasses = useAuthStyles();
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;
  const [loading, setLoading] = useState(false);

  const { handleSubmit, register, control } = useForm<{
    username: string;
    password: string;
    rememberDevice: boolean;
  }>();

  const onSubmit = handleSubmit(
    async (data: {
      username: string;
      password: string;
      rememberDevice: boolean;
    }) => {
      setLoading(true);
      authActions.clearError();
      try {
        authActions.passwordLogin({
          username: lowercaseAndTrimField(data.username),
          password: data.password,
          rememberDevice: data.rememberDevice,
        });
      } catch (e) {
        Sentry.captureException(e, {
          tags: {
            featureArea: "auth/login",
          },
        });
        authActions.authError(
          isGrpcError(e) ? e.message : t("global:error.fatal_message")
        );
      }
      setLoading(false);
    }
  );

  return (
    <>
      <form className={authClasses.form} onSubmit={onSubmit}>
        <InputLabel className={authClasses.formLabel} htmlFor="username">
          {t("auth:login_page.form.username_field_label")}
        </InputLabel>
        <TextField
          className={authClasses.formField}
          fullWidth
          id="username"
          inputRef={register({ required: true })}
          name="username"
          variant="standard"
        />
        <InputLabel className={authClasses.formLabel} htmlFor="password">
          {t("auth:login_page.form.password_field_label")}
        </InputLabel>
        <TextField
          className={authClasses.formField}
          fullWidth
          id="password"
          name="password"
          inputRef={register({ required: true })}
          type="password"
          variant="standard"
        />
        <div className={classes.loginOptions}>
          <Controller
            control={control}
            name="rememberDevice"
            defaultValue={true}
            render={({ onChange, value }) => (
              <FormControlLabel
                className={classes.rememberSwitch}
                control={
                  <CustomColorSwitch
                    size="small"
                    checked={value}
                    onClick={() => onChange(!value)}
                    isLoading={loading}
                  />
                }
                label={t("auth:login_page.form.remember_me")}
              />
            )}
          />
          <StyledLink href={resetPasswordRoute}>
            {t("auth:login_page.form.forgot_password")}
          </StyledLink>
        </div>
        <Button
          classes={{
            label: authClasses.buttonText,
          }}
          className={authClasses.button}
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
