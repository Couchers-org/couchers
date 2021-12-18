import { Typography, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { GetAccountInfoRes } from "proto/account_pb";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { service } from "service";
import { lowercaseAndTrimField } from "utils/validation";

import makeStyles from "../../../utils/makeStyles";
import useChangeDetailsFormStyles from "../useChangeDetailsFormStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(4, 0),
  },
}));

interface ChangeEmailFormData {
  newEmail: string;
  currentPassword?: string;
}

export default function ChangeEmail(accountInfo: GetAccountInfoRes.AsObject) {
  const { t } = useTranslation(["auth", "global"]);
  const classes = useStyles();
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
  } = useMutation<Empty, GrpcError, ChangeEmailFormData>(
    ({ currentPassword, newEmail }) =>
      service.account.changeEmail(newEmail, currentPassword),
    {
      onSuccess: () => {
        resetForm();
      },
    }
  );

  return (
    <div className={classes.root}>
      <Typography variant="h2">{t("auth:change_email_form.title")}</Typography>
      <>
        <Typography variant="body1">
          <Trans t={t} i18nKey="auth:change_email_form.current_email_message">
            Your email address is currently{" "}
            <b>{{ email: accountInfo.email }}</b>.
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
          {accountInfo && accountInfo.hasPassword && (
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
