import { Typography, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import PageTitle from "components/PageTitle";
import TextField from "components/TextField";
import useAccountInfo from "features/auth/useAccountInfo";
import useChangeDetailsFormStyles from "features/auth/useChangeDetailsFormStyles";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { accountInfoQueryKey } from "queryKeys";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service/index";

interface ChangePasswordVariables {
  oldPassword?: string;
  newPassword?: string;
}

interface ChangePasswordFormData extends ChangePasswordVariables {
  passwordConfirmation?: string;
}

export default function ChangePasswordPage() {
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
  const onSubmit = handleSubmit(({ newPassword, oldPassword }) => {
    changePassword({ newPassword, oldPassword });
  });

  const queryClient = useQueryClient();
  const {
    data: accountInfo,
    error: accountInfoError,
    isLoading: isAccountInfoLoading,
  } = useAccountInfo();
  const {
    error: changePasswordError,
    isLoading: isChangePasswordLoading,
    isSuccess: isChangePasswordSuccess,
    mutate: changePassword,
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
      <PageTitle>Change password</PageTitle>
      {isAccountInfoLoading ? (
        <CircularProgress />
      ) : accountInfoError ? (
        <Alert severity="error">{accountInfoError.message}</Alert>
      ) : (
        <>
          {changePasswordError && (
            <Alert severity="error">{changePasswordError.message}</Alert>
          )}
          {isChangePasswordSuccess && (
            <Alert severity="success">
              Your password change has been processed. Check your email for
              confirmation.
            </Alert>
          )}
          <Typography className={classes.infoText} variant="body1">
            {accountInfo?.hasPassword
              ? 'Please enter a password, or leave the "New password" and "Confirm password" fields blank to unset your password.'
              : "Please enter a password."}
          </Typography>
          <form className={classes.form} onSubmit={onSubmit}>
            {accountInfo && accountInfo.hasPassword && (
              <TextField
                id="oldPassword"
                inputRef={register({ required: true })}
                label="Old password"
                name="oldPassword"
                type="password"
                fullWidth={!isMdOrWider}
              />
            )}

            <TextField
              id="newPassword"
              inputRef={register({ required: !accountInfo?.hasPassword })}
              label="New password"
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
              label="Confirm password"
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
              Submit
            </Button>
          </form>
        </>
      )}
    </>
  );
}
