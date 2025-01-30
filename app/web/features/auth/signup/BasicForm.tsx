import Alert from "components/Alert";
import { useAuthContext } from "features/auth/AuthProvider";
import {
  StyledButton,
  StyledForm,
  StyledInputLabel,
  StyledTextField,
} from "features/auth/useAuthStyles";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import {
  emailValidationPattern,
  lowercaseAndTrimField,
  nameValidationPattern,
} from "utils/validation";

type SignupBasicInputs = {
  name: string;
  email: string;
};

interface BasicFormProps {
  submitText?: string;
  successCallback?: () => void;
}

export default function BasicForm({
  submitText,
  successCallback,
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

  const mutation = useMutation<void, RpcError, SignupBasicInputs>(
    async (data) => {
      const sanitizedEmail = lowercaseAndTrimField(data.email);
      const sanitizedName = data.name.trim();
      const state = await service.auth.startSignup(
        sanitizedName,
        sanitizedEmail,
      );
      return authActions.updateSignupState(state);
    },
    {
      onSettled() {
        window.scroll({ top: 0, behavior: "smooth" });
      },
      onSuccess() {
        if (successCallback !== undefined) {
          successCallback();
        }
      },
    },
  );

  const onSubmit = handleSubmit((data: SignupBasicInputs) => {
    mutation.mutate(data);
  });

  const nameInputRef = useRef<HTMLInputElement>();

  return (
    <>
      {mutation.error && (
        <Alert severity="error">{mutation.error.message || ""}</Alert>
      )}
      <StyledForm onSubmit={onSubmit}>
        <StyledInputLabel htmlFor="name">
          {t("auth:basic_form.name.field_label")}
        </StyledInputLabel>
        <StyledTextField
          id="name"
          {...register("name", {
            pattern: {
              message: t("auth:basic_form.name.empty_error"),
              value: nameValidationPattern,
            },
            required: t("auth:basic_form.name.required_error"),
          })}
          fullWidth
          name="name"
          variant="standard"
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
          variant="standard"
          helperText={errors?.email?.message ?? " "}
          error={!!errors?.email?.message}
          autoComplete="email"
        />
        <StyledButton
          onClick={onSubmit}
          type="submit"
          loading={mutation.isLoading}
          fullWidth
        >
          {submitText || t("global:continue")}
        </StyledButton>
      </StyledForm>
    </>
  );
}
