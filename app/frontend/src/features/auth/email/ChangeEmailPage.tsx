import { useMediaQuery, useTheme } from "@material-ui/core";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { sanitizeName } from "utils/validation";

import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import CircularProgress from "../../../components/CircularProgress";
import PageTitle from "../../../components/PageTitle";
import TextField from "../../../components/TextField";
import { service } from "../../../service";
import useAccountInfo from "../useAccountInfo";
import useChangeDetailsFormStyles from "../useChangeDetailsFormStyles";

interface ChangeEmailFormData {
  newEmail: string;
  currentPassword?: string;
}

export default function ChangeEmailPage() {
  const classes = useChangeDetailsFormStyles();
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));

  const {
    handleSubmit,
    register,
    reset: resetForm,
  } = useForm<ChangeEmailFormData>();
  const onSubmit = handleSubmit(({ currentPassword, newEmail }) => {
    const sanitizedEmail = sanitizeName(newEmail);
    changeEmail({ currentPassword, newEmail: sanitizedEmail });
  });

  const {
    data: accountInfo,
    error: accountInfoError,
    isLoading: isAccountInfoLoading,
  } = useAccountInfo();

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
      <PageTitle>Change email</PageTitle>
      {isAccountInfoLoading ? (
        <CircularProgress />
      ) : accountInfoError ? (
        <Alert severity="error">{accountInfoError.message}</Alert>
      ) : (
        <>
          {changeEmailError && (
            <Alert severity="error">{changeEmailError.message}</Alert>
          )}
          {isChangeEmailSuccess && (
            <Alert severity="success">
              Your email change has been received. Check your new email to
              complete the change.
            </Alert>
          )}
          <form className={classes.form} onSubmit={onSubmit}>
            {accountInfo && accountInfo.hasPassword && (
              <TextField
                id="currentPassword"
                inputRef={register({ required: true })}
                label="Current password"
                name="currentPassword"
                type="password"
                fullWidth={!isMdOrWider}
              />
            )}
            <TextField
              id="newEmail"
              inputRef={register({ required: true })}
              label="New email"
              name="newEmail"
              fullWidth={!isMdOrWider}
            />
            <Button
              fullWidth={!isMdOrWider}
              loading={isChangeEmailLoading}
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
