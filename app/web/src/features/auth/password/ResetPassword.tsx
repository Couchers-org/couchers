import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import TextField from "components/TextField";
import {
  ENTER_EMAIL,
  RESET_PASSWORD,
  RESET_PASSWORD_LINK,
  SUBMIT,
} from "features/auth/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import makeStyles from "utils/makeStyles";

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

export default function ResetPassword() {
  const classes = useStyles();
  const { handleSubmit, register } = useForm<{ userId: string }>();

  const {
    error,
    isLoading,
    isSuccess,
    mutate: resetPassword,
  } = useMutation<Empty, GrpcError, string>((userId) =>
    service.account.resetPassword(userId)
  );

  const onSubmit = handleSubmit(({ userId }) => {
    resetPassword(userId);
  });

  return (
    <>
      <HtmlMeta title={RESET_PASSWORD} />
      <PageTitle>{RESET_PASSWORD}</PageTitle>
      {error && <Alert severity="error">{error.message}</Alert>}
      <form className={classes.form} onSubmit={onSubmit}>
        <TextField
          classes={{ root: classes.textField }}
          id="userId"
          inputRef={register({ required: true })}
          label={ENTER_EMAIL}
          name="userId"
          fullWidth
        />
        <Button loading={isLoading} type="submit">
          {SUBMIT}
        </Button>
        {isSuccess && (
          <Typography variant="body1">{RESET_PASSWORD_LINK}</Typography>
        )}
      </form>
    </>
  );
}
