import { Container, styled, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { AuthRes } from "proto/auth_pb";
import { useForm } from "react-hook-form";
import { dashboardRoute } from "routes";
import { service } from "service";
import { theme } from "theme";
import stringOrFirstString from "utils/stringOrFirstString";

const StyledContainer = styled(Container)(() => ({
  marginTop: theme.spacing(2),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  flex: 1,
}));

const StyledForm = styled("form")(() => ({
  "& > * + *": {
    marginBlockStart: theme.spacing(1),
  },
}));

const StyledTextField = styled(TextField)(() => ({
  "& > div": {
    width: "100%",
    marginBottom: theme.spacing(2),
    [theme.breakpoints.up("md")]: {
      width: theme.typography.pxToRem(400),
    },
  },
}));

export default function CompleteResetPassword() {
  const { authState, authActions } = useAuthContext();
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { handleSubmit, register } = useForm<{
    newPassword: string;
    newPasswordCheck: string;
  }>();

  const router = useRouter();
  const resetToken = stringOrFirstString(router.query.token);
  const isResetTokenOk =
    !!resetToken && typeof resetToken === "string" && resetToken !== "";

  const { error, isPending, isSuccess, mutate } = useMutation<
    AuthRes,
    RpcError,
    string
  >({
    mutationFn: async (newPassword) => {
      const res = await service.account.CompletePasswordResetV2(
        resetToken as string,
        newPassword,
      );
      return res;
    },
    onSuccess: (authRes) => {
      authActions.firstLogin(authRes.toObject());
      router.push(dashboardRoute);
    },
  });

  const onSubmit = handleSubmit(({ newPassword, newPasswordCheck }) => {
    if (newPassword !== newPasswordCheck) {
      alert(t("auth:change_password_form.password_mismatch_error"));
      return;
    }

    mutate(newPassword);
  });

  if (authState.authenticated && !isSuccess) {
    return (
      <StyledContainer>
        <Alert severity="error">
          {t("auth:change_password_form.user_logged_error")}
        </Alert>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
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
        <Alert severity="success">
          {t("auth:change_password_form.reset_password_success")}
        </Alert>
      )}

      <Typography variant="h1" gutterBottom>
        {t("auth:change_password_form.title")}
      </Typography>

      <Typography variant="body1" gutterBottom>
        {t("auth:change_password_form.subtitle")}
      </Typography>

      <StyledForm onSubmit={onSubmit}>
        <StyledTextField
          id="newPassword"
          {...register("newPassword", { required: true })}
          label={t("auth:change_password_form.new_password")}
          name="newPassword"
          type="password"
          variant="outlined"
        />

        <StyledTextField
          id="newPasswordCheck"
          {...register("newPasswordCheck", { required: true })}
          label={t("auth:change_password_form.confirm_password")}
          type="password"
          variant="outlined"
        />

        <Button
          loading={isPending}
          type="submit"
          disabled={isPending || !isResetTokenOk || authState.authenticated}
        >
          {t("global:submit")}
        </Button>
      </StyledForm>
    </StyledContainer>
  );
}
