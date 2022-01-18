import { InputLabel } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { RpcError } from "grpc-web";
import { useTranslation } from "next-i18next";
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

export default function BasicForm() {
  const { t } = useTranslation(["auth", "global"]);
  const { authActions } = useAuthContext();
  const authClasses = useAuthStyles();

  const { register, handleSubmit, errors } = useForm<SignupBasicInputs>({
    mode: "onBlur",
    shouldUnregister: false,
  });

  const mutation = useMutation<void, RpcError, SignupBasicInputs>(
    async (data) => {
      const sanitizedEmail = lowercaseAndTrimField(data.email);
      const sanitizedName = data.name.trim();
      const state = await service.auth.startSignup(
        sanitizedName,
        sanitizedEmail
      );
      return authActions.updateSignupState(state);
    },
    {
      onSettled() {
        window.scroll({ top: 0, behavior: "smooth" });
      },
    }
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
      <form className={authClasses.form} onSubmit={onSubmit}>
        <InputLabel className={authClasses.formLabel} htmlFor="name">
          {t("auth:basic_form.name.field_label")}
        </InputLabel>
        <TextField
          id="name"
          fullWidth
          className={authClasses.formField}
          name="name"
          variant="standard"
          inputRef={(el: HTMLInputElement | null) => {
            if (!nameInputRef.current) el?.focus();
            if (el) nameInputRef.current = el;
            register(el, {
              pattern: {
                message: t("auth:basic_form.name.empty_error"),
                value: nameValidationPattern,
              },
              required: t("auth:basic_form.name.required_error"),
            });
          }}
          helperText={errors?.name?.message ?? " "}
          error={!!errors?.name?.message}
        />
        <InputLabel className={authClasses.formLabel} htmlFor="email">
          {t("auth:basic_form.email.field_label")}
        </InputLabel>
        <TextField
          id="email"
          fullWidth
          className={authClasses.formField}
          name="email"
          variant="standard"
          inputRef={register({
            pattern: {
              message: t("auth:basic_form.email.empty_error"),
              value: emailValidationPattern,
            },
            required: t("auth:basic_form.email.required_error"),
          })}
          helperText={errors?.email?.message ?? " "}
          error={!!errors?.email?.message}
        />
        <Button
          classes={{
            label: authClasses.buttonText,
            root: authClasses.button,
          }}
          onClick={onSubmit}
          type="submit"
          loading={mutation.isLoading}
          fullWidth
        >
          {t("global:continue")}
        </Button>
      </form>
    </>
  );
}
