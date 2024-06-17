import { Typography, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import useChangeDetailsFormStyles from "features/auth/useChangeDetailsFormStyles";
import { accountInfoQueryKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

interface ChangePasswordVariables {
  oldPassword: string;
  newPassword: string;
}

interface ChangePasswordFormData extends ChangePasswordVariables {
  passwordConfirmation: string;
}

interface ChangePasswordProps {
  className?: string;
}

export default function ChangePassword({ className }: ChangePasswordProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const classes = useChangeDetailsFormStyles();
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));

  const {
    errors,
    getValues,
    handleSubmit,
    reset: resetForm,
    register,
  } = useForm<ChangePasswordFormData>({
    mode: "onBlur",
  });
  const onSubmit = handleSubmit(({ oldPassword, newPassword }) => {
    changePassword({ oldPassword, newPassword });
  });

  const queryClient = useQueryClient();
  const {
    error: changePasswordError,
    isLoading: isChangePasswordLoading,
    isSuccess: isChangePasswordSuccess,
    mutate: changePassword,
  } = useMutation<Empty, RpcError, ChangePasswordVariables>(
    ({ oldPassword, newPassword }) =>
      service.account.changePassword(oldPassword, newPassword),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(accountInfoQueryKey);
        resetForm();
      },
    }
  );

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("auth:change_password_form.title")}
      </Typography>
      {changePasswordError && (
        <Alert severity="error">{changePasswordError.message}</Alert>
      )}
      {isChangePasswordSuccess && (
        <Alert severity="success">
          {t("auth:change_password_form.password_changed_success")}
        </Alert>
      )}
      <form className={classes.form} onSubmit={onSubmit}>
        <TextField
          id="oldPassword"
          inputRef={register({ required: true })}
          label={t("auth:change_password_form.old_password")}
          name="oldPassword"
          type="password"
          fullWidth={!isMdOrWider}
        />
        <TextField
          id="newPassword"
          inputRef={register({ required: true })}
          label={t("auth:change_password_form.new_password")}
          name="newPassword"
          type="password"
          fullWidth={!isMdOrWider}
        />
        <TextField
          id="passwordConfirmation"
          inputRef={register({
            validate: (value) =>
              value === getValues("newPassword") ||
              t("auth:change_password_form.password_mismatch_error"),
          })}
          label={t("auth:change_password_form.confirm_password")}
          name="passwordConfirmation"
          fullWidth={!isMdOrWider}
          type="password"
          helperText={errors.passwordConfirmation?.message}
        />
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
