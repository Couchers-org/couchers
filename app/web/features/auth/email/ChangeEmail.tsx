import { styled, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useForm } from "react-hook-form";
import { service } from "service";
import { theme } from "theme";
import useIsScreenSmallerThan from "utils/useIsScreenSmallerThan";
import { lowercaseAndTrimField } from "utils/validation";

const StyledForm = styled("form")(() => ({
  marginBottom: theme.spacing(2),
  "& > * + *": {
    marginBlockStart: theme.spacing(1),
  },
}));

interface ChangeEmailFormData {
  newEmail: string;
  currentPassword: string;
}

interface ChangeEmailProps {
  email: string;
  className?: string;
}

export default function ChangeEmail({ className, email }: ChangeEmailProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const isMobile = useIsScreenSmallerThan("MOBILE");
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
    isPending: isChangeEmailLoading,
    isSuccess: isChangeEmailSuccess,
    mutate: changeEmail,
  } = useMutation<Empty, RpcError, ChangeEmailFormData>({
    mutationFn: ({ currentPassword, newEmail }) =>
      service.account.changeEmail(newEmail, currentPassword),
    onSuccess: () => {
      resetForm();
    },
  });

  return (
    <div className={className}>
      <Typography variant="h2">{t("auth:change_email_form.title")}</Typography>
      <>
        <Typography variant="body1">
          <Trans
            i18nKey="auth:change_email_form.current_email_message"
            values={{ email }}
          >
            {`Your email address is currently `}
            <strong>{email}</strong>
            {`.`}
          </Trans>
        </Typography>
        {changeEmailError && (
          <Alert severity="error">{changeEmailError.message}</Alert>
        )}
        {isChangeEmailSuccess && (
          <Alert severity="success">
            {t("auth:change_email_form.success_message")}
          </Alert>
        )}
        <StyledForm onSubmit={onSubmit}>
          <TextField
            id="currentPassword"
            {...register("currentPassword", { required: true })}
            label={t("auth:change_email_form.current_password")}
            type="password"
            fullWidth={isMobile}
          />
          <TextField
            id="newEmail"
            {...register("newEmail", { required: true })}
            label={t("auth:change_email_form.new_email")}
            name="newEmail"
            fullWidth={isMobile}
          />
          <Button
            fullWidth={isMobile}
            loading={isChangeEmailLoading}
            type="submit"
          >
            {t("global:submit")}
          </Button>
        </StyledForm>
      </>
    </div>
  );
}
