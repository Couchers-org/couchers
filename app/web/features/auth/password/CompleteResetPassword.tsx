import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import stringOrFirstString from "utils/stringOrFirstString";
import { useAuthContext } from "features/auth/AuthProvider";
import { Typography, Container } from "@material-ui/core";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import HtmlMeta from "components/HtmlMeta";
import { useMutation } from "react-query";
import { useForm } from "react-hook-form";
import makeStyles from "utils/makeStyles";
import { useRouter } from "next/router";
import { AUTH, GLOBAL } from "i18n/namespaces";
import Button from "components/Button";
import { useTranslation } from "i18n";
import Alert from "components/Alert";
import { loginRoute } from "routes";
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
    },
  },
}));

export default function CompleteResetPassword() {
  const { authState } = useAuthContext();
  const { t } = useTranslation([AUTH, GLOBAL]);
  const formClass = useStyles();
  const { handleSubmit, register } =
    useForm<{ newPassword: string; newPasswordCheck: string }>();

  const router = useRouter();
  const resetToken = stringOrFirstString(router.query.token);
  const isResetTokenOk =
    !!resetToken && typeof resetToken === "string" && resetToken !== "";

  const { error, isLoading, isSuccess, mutate } = useMutation<
    Empty,
    RpcError,
    string
  >((newPassword) =>
    service.account.CompletePasswordResetV2(resetToken as string, newPassword)
  );

  const onSubmit = handleSubmit(({ newPassword, newPasswordCheck }) => {
    if (newPassword !== newPasswordCheck) {
      alert(t("auth:change_password_form.password_mismatch_error"));
      return;
    }

    mutate(newPassword);
  });

  if (authState.authenticated) {
    return (
      <Container className={formClass.standardContainer}>
        <Alert severity="error">
          Can't changed the password if you are logged in
        </Alert>
      </Container>
    );
  }

  return (
    <Container className={formClass.standardContainer}>
      <HtmlMeta title={t("auth:change_password_form.title")} />

      {!isResetTokenOk && (
        <Alert severity="error">
          {t("auth:change_password_form.token_error")}
        </Alert>
      )}

      {error && (
        <Alert severity="error">
          {t("auth:change_password_form.reset_password_error", {
            message: error.message,
          })}
        </Alert>
      )}

      {isSuccess && (
        <>
          <Alert severity="success">
            {t("auth:change_password_form.reset_password_success")}
          </Alert>
          <StyledLink href={loginRoute}>{t("auth:login_prompt")}</StyledLink>
        </>
      )}

      <Typography variant="h1" gutterBottom>
        {t("auth:change_password_form.title")}
      </Typography>

      <Typography variant="body1" gutterBottom>
        {t("auth:change_password_form.subtitle")}
      </Typography>

      <form className={formClass.form} onSubmit={onSubmit}>
        <TextField
          className={formClass.textField}
          id="newPassword"
          inputRef={register({ required: true })}
          label={t("auth:change_password_form.new_password")}
          name="newPassword"
          type="password"
          variant="outlined"
        />

        <TextField
          className={formClass.textField}
          id="newPasswordCheck"
          inputRef={register({ required: true })}
          label={t("auth:change_password_form.confirm_password")}
          name="newPasswordCheck"
          type="password"
          variant="outlined"
        />

        <Button
          loading={isLoading}
          type="submit"
          disabled={isLoading || !isResetTokenOk || authState.authenticated}
        >
          {t("global:submit")}
        </Button>
      </form>
    </Container>
  );
}
