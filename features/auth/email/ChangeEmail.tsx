import { Typography, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import { lowercaseAndTrimField } from "utils/validation";

import useChangeDetailsFormStyles from "../useChangeDetailsFormStyles";

interface ChangeEmailFormData {
  newEmail: string;
  currentPassword?: string;
}

interface ChangeEmailProps {
  email: string;
  hasPassword: boolean;
  className?: string;
}

export default function ChangeEmail({
  className,
  email,
  hasPassword,
}: ChangeEmailProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const formClasses = useChangeDetailsFormStyles();
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));

  const {
    handleSubmit,
    register,
    reset: resetForm,
  } = useForm<ChangeEmailFormData>();
  const onSubmit = handleSubmit(({ currentPassword, newEmail }) => {
    changeEmail({ currentPassword, newEmail: lowercaseAndTrimField(newEmail) });
  });

  const {
    error: changeEmailError,
    isLoading: isChangeEmailLoading,
    isSuccess: isChangeEmailSuccess,
    mutate: changeEmail,
  } = useMutation<Empty, RpcError, ChangeEmailFormData>(
    ({ currentPassword, newEmail }) =>
      service.account.changeEmail(newEmail, currentPassword),
    {
      onSuccess: () => {
        resetForm();
      },
    }
  );

  return (
    <div className={className}>
      <Typography variant="h2">{t("auth:change_email_form.title")}</Typography>
      <>
        <Typography variant="body1">
          <Trans t={t} i18nKey="auth:change_email_form.current_email_message">
            Your email address is currently <strong>{{ email }}</strong>.
          </Trans>
        </Typography>
        {changeEmailError && (
          <Alert severity="error">{changeEmailError.message}</Alert>
        )}
        {isChangeEmailSuccess && (
          <Alert severity="success">
            {t("auth:change_email_form.success_message")}
          </Alert>
        )}
        <form className={formClasses.form} onSubmit={onSubmit}>
          {hasPassword && (
            <TextField
              id="currentPassword"
              inputRef={register({ required: true })}
              label={t("auth:change_email_form.current_password")}
              name="currentPassword"
              type="password"
              fullWidth={!isMdOrWider}
            />
          )}
          <TextField
            id="newEmail"
            inputRef={register({ required: true })}
            label={t("auth:change_email_form.new_email")}
            name="newEmail"
            fullWidth={!isMdOrWider}
          />
          <Button
            fullWidth={!isMdOrWider}
            loading={isChangeEmailLoading}
            type="submit"
          >
            {t("global:submit")}
          </Button>
        </form>
      </>
    </div>
  );
}
