import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import makeStyles from "utils/makeStyles";
import { lowercaseAndTrimField } from "utils/validation";

const useStyles = makeStyles((theme) => ({
  form: {
    "& > * + *": {
      marginBlockStart: theme.spacing(1),
    },
  },
  main: {
    padding: theme.spacing(0, 3),
  },
  textField: {
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: theme.typography.pxToRem(400),
    },
  },
}));

export default function ResetPassword() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const classes = useStyles();
  const { handleSubmit, register } = useForm<{ userId: string }>();

  const {
    error,
    isLoading,
    isSuccess,
    mutate: resetPassword,
  } = useMutation<Empty, RpcError, string>((userId) =>
    service.account.resetPassword(userId)
  );

  const onSubmit = handleSubmit(({ userId }) => {
    resetPassword(lowercaseAndTrimField(userId));
  });

  return (
    <main className={classes.main}>
      <HtmlMeta title={t("auth:reset_password")} />
      <PageTitle>{t("auth:reset_password")}</PageTitle>
      {error && <Alert severity="error">{error.message}</Alert>}
      <form className={classes.form} onSubmit={onSubmit}>
        <TextField
          classes={{ root: classes.textField }}
          id="userId"
          inputRef={register({ required: true })}
          label={t("auth:reset_password_form.enter_email")}
          name="userId"
          variant="standard"
          fullWidth
        />
        <Button loading={isLoading} type="submit">
          {t("global:submit")}
        </Button>
        {isSuccess && (
          <Typography variant="body1">
            {t("auth:reset_password_form.success_message")}
          </Typography>
        )}
      </form>
    </main>
  );
}
