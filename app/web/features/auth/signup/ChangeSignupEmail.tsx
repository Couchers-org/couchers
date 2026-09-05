import { styled, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { service } from "service";
import { lowercaseAndTrimField } from "utils/validation";

const StyledForm = styled("form")(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  alignItems: "flex-start",
  width: "100%",
  [theme.breakpoints.up("md")]: {
    width: "25.5rem",
  },
}));

interface ChangeSignupEmailFormData {
  newSignupEmail: string;
}

interface ChangeSignupEmailProps {
  email: string;
  className?: string;
}

export default function ChangeSignupEmail({ className }: ChangeSignupEmailProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authActions, authState } = useAuthContext();

  const [changedEmail, setChangedEmail] = useState<boolean>(false);

  const { handleSubmit, register, reset: resetForm } = useForm<ChangeSignupEmailFormData>();
  const onSubmit = handleSubmit(({ newSignupEmail }) => {
    const sanitizedEmail = lowercaseAndTrimField(newSignupEmail);
    setChangedEmail(true);
    changeSignupEmail({ newSignupEmail: sanitizedEmail });
  });

  const {
    error: changeSignupEmailError,
    isPending: isChangeSignupEmailLoading,
    isSuccess: isChangeSignupEmailSuccess,
    mutate: changeSignupEmail,
  } = useMutation<Empty, RpcError, ChangeSignupEmailFormData>({
    mutationFn: async ({ newSignupEmail }) => {
      await service.auth.signupFlowChangeEmail(authState.flowState!.flowToken, lowercaseAndTrimField(newSignupEmail));
    },
    onSuccess: (_, { newSignupEmail }) => {
      const sanitizedEmail = lowercaseAndTrimField(newSignupEmail);
      authActions.assignSignupEmail(sanitizedEmail);
      resetForm();
    },
  });

  return (
    <div className={className}>
      <Typography variant="body1" gutterBottom>
        {!changedEmail ? t("auth:sign_up_change_email") : ""}
      </Typography>
      <>
        {changeSignupEmailError && <Alert severity="error">{changeSignupEmailError.message}</Alert>}
        {isChangeSignupEmailSuccess && (
          <Alert severity="success">{t("auth:change_signup_email_form.success_message")}</Alert>
        )}
        {!changedEmail && (
          <StyledForm onSubmit={onSubmit}>
            <TextField
              id="newSignupEmail"
              {...register("newSignupEmail", { required: true })}
              label={t("auth:change_signup_email_form.new_email")}
              name="newSignupEmail"
              fullWidth
            />
            <Button fullWidth={true} loading={isChangeSignupEmailLoading} type="submit">
              {t("auth:change_signup_email_form.signup_change_email")}
            </Button>
          </StyledForm>
        )}
      </>
    </div>
  );
}
