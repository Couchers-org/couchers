import { Typography, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { GetAccountInfoRes } from "proto/account_pb";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import { lowercaseAndTrimField } from "utils/validation";

import {
  CHANGE_EMAIL,
  CHECK_EMAIL,
  CURRENT_PASSWORD,
  NEW_EMAIL,
  SUBMIT,
  YOUR_EMAIL_IS,
} from "../constants";
import useChangeDetailsFormStyles from "../useChangeDetailsFormStyles";

interface ChangeEmailFormData {
  newEmail: string;
  currentPassword?: string;
}

export default function ChangeEmail(accountInfo: GetAccountInfoRes.AsObject) {
  const classes = useChangeDetailsFormStyles();
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
    <>
      <Typography variant="h2">{CHANGE_EMAIL}</Typography>
      <>
        <Typography variant="body1">
          {YOUR_EMAIL_IS} <b>{accountInfo.email}</b>.
        </Typography>
        {changeEmailError && (
          <Alert severity="error">{changeEmailError.message}</Alert>
        )}
        {isChangeEmailSuccess && (
          <Alert severity="success">{CHECK_EMAIL}</Alert>
        )}
        <form className={classes.form} onSubmit={onSubmit}>
          {accountInfo && accountInfo.hasPassword && (
            <TextField
              id="currentPassword"
              inputRef={register({ required: true })}
              label={CURRENT_PASSWORD}
              name="currentPassword"
              type="password"
              fullWidth={!isMdOrWider}
            />
          )}
          <TextField
            id="newEmail"
            inputRef={register({ required: true })}
            label={NEW_EMAIL}
            name="newEmail"
            fullWidth={!isMdOrWider}
          />
          <Button
            fullWidth={!isMdOrWider}
            loading={isChangeEmailLoading}
            type="submit"
          >
            {SUBMIT}
          </Button>
        </form>
      </>
    </>
  );
}
