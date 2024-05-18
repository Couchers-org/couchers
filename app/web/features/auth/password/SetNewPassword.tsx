import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { CircularProgress, Container } from "@material-ui/core";
import stringOrFirstString from "utils/stringOrFirstString";
import { Typography } from "@material-ui/core";
import TextField from "components/TextField";
import HtmlMeta from "components/HtmlMeta";
import { useMutation } from "react-query";
import { useForm } from "react-hook-form";
import makeStyles from "utils/makeStyles";
import { useRouter } from "next/router";
import { AUTH } from "i18n/namespaces";
import Button from "components/Button";
import { useTranslation } from "i18n";
import Alert from "components/Alert";
import { RpcError } from "grpc-web";
import { service } from "service";

const useStyles = makeStyles((theme) => ({
  form: {
    "& > * + *": {
      marginBlockStart: theme.spacing(1),
    },
  },
  standardContainer: {
    marginTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    flex: 1,
  },
  main: {
    padding: theme.spacing(0, 3),
  },
  textField: {
    "& > div": {
      width: "100%",
      marginBottom: theme.spacing(2),
      [theme.breakpoints.up("md")]: {
        width: theme.typography.pxToRem(400),
      },
    }
  },
}));

export default function SetNewPassword() {
  const { t } = useTranslation(AUTH);
  const formClass = useStyles();
  const { handleSubmit, register } = useForm<{ newPassword: string, newPasswordCheck: string }>();

  const router = useRouter();
  const resetToken = stringOrFirstString(router.query.token);
  const isResetTokenOk = !!resetToken && typeof resetToken === "string" && resetToken !== "";

  const {
    error,
    isLoading,
    isSuccess,
    mutate: CompletePasswordResetV2,
  } = useMutation<Empty, RpcError, string>((newPassword) =>
    service.account.CompletePasswordResetV2(resetToken as string, newPassword)
  );

  const onSubmit = handleSubmit(({ newPassword, newPasswordCheck }) => {

    if (newPassword !== newPasswordCheck) {
      alert(t('change_password_form.password_mismatch_error'))
      return;
    }

    if (!isResetTokenOk) {
      alert(t('missing_token'));
      return;
    }

    CompletePasswordResetV2(newPassword);
  });

  return (
    <Container className={formClass.standardContainer}>
      <HtmlMeta title={t("reset_password")} />

      {!isResetTokenOk &&
        <Alert severity="error">{t("change_password_form.token_error")}</Alert>
      }

      {error && (
        <Alert severity="error">
          {t("reset_password_error", {
            message: error.message,
          })}
        </Alert>
      )}

      {isSuccess && <Alert severity="success">{t("reset_password_success")}</Alert>}

      <Typography variant="h1" gutterBottom>
        {t("reset_password")}
      </Typography>

      <form className={formClass.form} onSubmit={onSubmit}>
        <TextField
          className={formClass.textField}
          id="newPassword"
          type="password"
          inputRef={register({ required: true })}
          label={t("change_password_form.new_password")}
          name="newPassword"
          variant="outlined"
        />

        <TextField
          className={formClass.textField}
          id="newPasswordCheck"
          inputRef={register({ required: true })}
          label={t("change_password_form.confirm_password")}
          name="newPasswordCheck"
          type="password"
          fullWidth={false}
          variant="outlined"
          multiline
          margin="normal"
        />

        <Button loading={isLoading} type="submit" disabled={isLoading}>
          {t("global:submit")}
        </Button>
      </form>
    </Container>
  );
}
