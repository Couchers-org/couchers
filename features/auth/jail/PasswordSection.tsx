import { TextField, Typography, useMediaQuery } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import Button from "components/Button";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import { theme } from "theme";
import useChangeDetailsFormStyles from "features/auth/useChangeDetailsFormStyles";

interface SetPasswordVariables {
  password?: string;
}

interface SetPasswordFormData extends SetPasswordVariables {
  passwordConfirmation?: string;
}

interface PasswordSectionProps {
  updateJailed: () => void;
  className?: string;
}

export default function PasswordSection({
  updateJailed,
  className,
}: PasswordSectionProps) {
  const classes = useChangeDetailsFormStyles();
  const { t } = useTranslation(["auth", "global"]);

  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));

  const {
    errors,
    getValues,
    handleSubmit,
    reset: resetForm,
    register,
  } = useForm<SetPasswordFormData>({
    mode: "onBlur",
  });
  const onSubmit = handleSubmit(({ password }) => {
    changePassword({ password });
  });

  const {
    error: changePasswordError,
    isLoading: isChangePasswordLoading,
    isSuccess: isChangePasswordSuccess,
    mutate: changePassword,
    variables: setPasswordVariables,
  } = useMutation<Empty, GrpcError, SetPasswordVariables>(
    ({ password }) => service.jail.setPassword(password),
    {
      onSuccess: () => {
        updateJailed();
        resetForm();
      },
    }
  );

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("auth:jail_set_password_form.title")}
      </Typography>
      <Typography variant="body1">
        {t("auth:jail_set_password_form.explanation")}
      </Typography>
      {changePasswordError && (
        <Alert severity="error">{changePasswordError.message}</Alert>
      )}
      {isChangePasswordSuccess && (
        <Alert severity="success">
          {setPasswordVariables?.password
            ? t("auth:change_password_form.password_changed_success")
            : t("auth:reset_password_success")}
        </Alert>
      )}
      <form className={classes.form} onSubmit={onSubmit}>
        <TextField
          id="password"
          inputRef={register()}
          label={t("auth:change_password_form.new_password")}
          name="password"
          type="password"
          fullWidth={!isMdOrWider}
        />
        <br />
        <TextField
          id="passwordConfirmation"
          inputRef={register({
            validate: (value) =>
              value === getValues("password") ||
              t("auth:change_password_form.password_mismatch_error"),
          })}
          label={t("auth:change_password_form.confirm_password")}
          name="passwordConfirmation"
          fullWidth={!isMdOrWider}
          type="password"
          helperText={errors.passwordConfirmation?.message}
        />
        <br />
        <Button
          fullWidth={!isMdOrWider}
          loading={isChangePasswordLoading}
          type="submit"
        >
          {t("global:submit")}
        </Button>
      </form>
    </div>
  );
}
