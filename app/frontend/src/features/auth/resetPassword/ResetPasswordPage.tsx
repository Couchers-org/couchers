import { makeStyles, Typography } from "@material-ui/core";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";

import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import PageTitle from "../../../components/PageTitle";
import TextField from "../../../components/TextField";
import { service } from "../../../service";

const useStyles = makeStyles((theme) => ({
  form: {
    "& > * + *": {
      marginBlockStart: theme.spacing(1),
    },
  },
  textField: {
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: theme.typography.pxToRem(400),
    },
  },
}));

export default function ResetPasswordPage() {
  const classes = useStyles();
  const { handleSubmit, register } = useForm<{ userId: string }>();

  const { error, isLoading, isSuccess, mutate: resetPassword } = useMutation<
    Empty,
    GrpcError,
    string
  >((userId) => service.auth.resetPassword(userId));

  const onSubmit = handleSubmit(({ userId }) => {
    resetPassword(userId);
  });

  return (
    <>
      <PageTitle>Reset your password</PageTitle>
      {error && <Alert severity="error">{error.message}</Alert>}
      <form className={classes.form} onSubmit={onSubmit}>
        <TextField
          classes={{ root: classes.textField }}
          id="userId"
          inputRef={register({ required: true })}
          label="Enter your username/email"
          name="userId"
          fullWidth
        />
        <Button loading={isLoading} type="submit">
          Submit
        </Button>
        {isSuccess && (
          <Typography variant="body1">
            Check your email for a reset password link!
          </Typography>
        )}
      </form>
    </>
  );
}
