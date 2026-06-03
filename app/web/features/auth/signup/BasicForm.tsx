import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import { doAntibot } from "features/antibot/antibot";
import { useAuthContext } from "features/auth/AuthProvider";
import {
  StyledButton,
  StyledInputLabel,
  StyledTextField,
} from "features/auth/useAuthStyles";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { service } from "service";
import {
  emailValidationPattern,
  lowercaseAndTrimField,
  nameMinLength,
  nameMaxLength,
  nameValidationPattern,
} from "utils/validation";

type SignupBasicInputs = {
  name: string;
  email: string;
};

interface BasicFormProps {
  submitText?: string;
  successCallback?: () => void;
  inviteCode?: string;
}

export default function BasicForm({
  submitText,
  successCallback,
  inviteCode,
}: BasicFormProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authActions } = useAuthContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupBasicInputs>({
    mode: "onBlur",
    shouldUnregister: false,
  });

  const mutation = useMutation<void, RpcError, SignupBasicInputs>({
    mutationFn: async (data) => {
      const sanitizedEmail = lowercaseAndTrimField(data.email);
      const sanitizedName = data.name.trim();
      const state = await service.auth.startSignup(
        sanitizedName,
        sanitizedEmail,
        inviteCode,
      );
      doAntibot("signup");
      return authActions.updateSignupState(state);
    },
    onSettled() {
      window.scroll({ top: 0, behavior: "smooth" });
    },
    onSuccess() {
      if (successCallback !== undefined) {
        successCallback();
      }
    },
  });

  const onSubmit = handleSubmit((data: SignupBasicInputs) => {
    mutation.mutate(data);
  });

  const nameInputRef = useRef<HTMLInputElement>(undefined);

  return (
    <>
      {mutation.error && (
        <Alert severity="error">{mutation.error.message || ""}</Alert>
      )}
      <form onSubmit={onSubmit}>
        <StyledInputLabel htmlFor="name">
          {t("auth:basic_form.name.field_label")}
        </StyledInputLabel>
        <StyledTextField
          id="name"
          {...register("name", {
            required: t("auth:basic_form.name.required_error"),
            minLength: {
              value: nameMinLength,
              message: t("auth:basic_form.name.min_length_error"),
            },
            maxLength: {
              value: nameMaxLength,
              message: t("auth:basic_form.name.max_length_error"),
            },
            pattern: {
              message: t("auth:basic_form.name.invalid_characters_error"),
              value: nameValidationPattern,
            },
          })}
          fullWidth
          name="name"
          placeholder={t("auth:basic_form.name.field_label")}
          variant="outlined"
          inputRef={(el: HTMLInputElement | null) => {
            if (!nameInputRef.current) el?.focus();
            if (el) nameInputRef.current = el;
          }}
          helperText={errors?.name?.message ?? " "}
          error={!!errors?.name?.message}
          autoComplete="name"
        />
        <StyledInputLabel htmlFor="email">
          {t("auth:basic_form.email.field_label")}
        </StyledInputLabel>
        <StyledTextField
          id="email"
          {...register("email", {
            pattern: {
              message: t("auth:basic_form.email.empty_error"),
              value: emailValidationPattern,
            },
            required: t("auth:basic_form.email.required_error"),
          })}
          fullWidth
          name="email"
          placeholder="you@couchers.org"
          variant="outlined"
          helperText={errors?.email?.message ?? " "}
          error={!!errors?.email?.message}
          autoComplete="email"
        />
        <StyledButton
          onClick={onSubmit}
          type="submit"
          loading={mutation.isPending}
          fullWidth
        >
          {submitText || t("global:continue")}
        </StyledButton>
      </form>
    </>
  );
}
