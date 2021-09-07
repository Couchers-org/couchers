import { Typography, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import {
  CHANGE_PASSWORD,
  CONFIRM_PASSWORD,
  NEW_PASSWORD,
  OLD_PASSWORD,
  PASSWORD_CHANGED,
  RESET_PASSWORD_SUCCESS,
  SUBMIT,
} from "features/auth/constants";
import useChangeDetailsFormStyles from "features/auth/useChangeDetailsFormStyles";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { GetAccountInfoRes } from "proto/account_pb";
import { accountInfoQueryKey } from "queryKeys";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

interface ChangePasswordVariables {
  oldPassword?: string;
  newPassword?: string;
}

interface ChangePasswordFormData extends ChangePasswordVariables {
  passwordConfirmation?: string;
}

export default function ChangePassword(
  accountInfo: GetAccountInfoRes.AsObject
) {
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
    variables: changePasswordVariables,
  } = useMutation<Empty, GrpcError, ChangePasswordVariables>(
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
    <>
      <Typography variant="h2">{CHANGE_PASSWORD}</Typography>
      {changePasswordError && (
        <Alert severity="error">{changePasswordError.message}</Alert>
      )}
      {isChangePasswordSuccess && (
        <Alert severity="success">
          {changePasswordVariables?.newPassword
            ? PASSWORD_CHANGED
            : RESET_PASSWORD_SUCCESS}
        </Alert>
      )}
      <form className={classes.form} onSubmit={onSubmit}>
        {accountInfo && accountInfo.hasPassword && (
          <TextField
            id="oldPassword"
            inputRef={register({ required: true })}
            label={OLD_PASSWORD}
            name="oldPassword"
            type="password"
            fullWidth={!isMdOrWider}
          />
        )}
        <TextField
          id="newPassword"
          inputRef={register({ required: !accountInfo?.hasPassword })}
          label={NEW_PASSWORD}
          name="newPassword"
          type="password"
          fullWidth={!isMdOrWider}
        />
        <TextField
          id="passwordConfirmation"
          inputRef={register({
            validate: (value) =>
              value === getValues("newPassword") ||
              "This does not match the new password you typed above",
          })}
          label={CONFIRM_PASSWORD}
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
          {SUBMIT}
        </Button>
      </form>
    </>
  );
}
