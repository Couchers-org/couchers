import { styled, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { service } from "service";
import {
  emailValidationPattern,
  lowercaseAndTrimField
} from "utils/validation";

const StyledForm = styled("form")(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  alignItems: "flex-start",
  width: "100%",
}));

interface ChangeSignupEmailFormData {
  newSignupEmail: string;
}

export default function ChangeSignupEmail() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authActions, authState } = useAuthContext();

  const [changedEmail, setChangedEmail] = useState<boolean>(false);

  const { formState: { errors }, handleSubmit, register, reset: resetForm, watch } = useForm<ChangeSignupEmailFormData>({mode:"onBlur"});
  const newSignupEmail = watch("newSignupEmail", "");
  const isSubmitDisabled =
  !newSignupEmail.trim() ||
  !!errors.newSignupEmail ||
  lowercaseAndTrimField(newSignupEmail) ===
    lowercaseAndTrimField(authState.flowState!.email);

  const onSubmit = handleSubmit(({ newSignupEmail }) => {
    const sanitizedEmail = lowercaseAndTrimField(newSignupEmail || "");
    changeSignupEmail({ newSignupEmail: sanitizedEmail || "" });
  });

  const {
    error: changeSignupEmailError,
    isPending: isChangeSignupEmailLoading,
    isSuccess: isChangeSignupEmailSuccess,
    mutate: changeSignupEmail,
  } = useMutation<void, RpcError, ChangeSignupEmailFormData>({
    mutationFn: async ({ newSignupEmail }) => {
      resetForm();
      const state = await service.auth.signupFlowChangeEmail(
        authState.flowState!.flowToken,
        lowercaseAndTrimField(newSignupEmail),
      );
      authActions.updateSignupState(state);
    },
    onSuccess: () => {
      setChangedEmail(true);
    },
  });

  return (
    <div>
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
              {...register("newSignupEmail", { pattern: {
              message: t("auth:basic_form.email.empty_error"),
              value: emailValidationPattern,
            },required: true })}
              placeholder={t("auth:change_signup_email_form.new_email")}
              name="newSignupEmail"
              fullWidth
              error={!!errors.newSignupEmail}
              helperText={errors.newSignupEmail?.message ?? " "}
            />
            <Button fullWidth={true} loading={isChangeSignupEmailLoading} type="submit" disabled={isSubmitDisabled}>
              {t("auth:change_signup_email_form.signup_change_email")}
            </Button>
          </StyledForm>
        )}
      </>
    </div>
  );
}
