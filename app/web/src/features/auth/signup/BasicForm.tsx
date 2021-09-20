import { InputLabel } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { Error as GrpcError } from "grpc-web";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import {
  emailValidationPattern,
  lowercaseAndTrimField,
  nameValidationPattern,
} from "utils/validation";

import {
  CONTINUE,
  EMAIL_EMPTY,
  EMAIL_LABEL,
  EMAIL_REQUIRED,
  NAME_EMPTY,
  NAME_LABEL,
  NAME_REQUIRED,
} from "../constants";

type SignupBasicInputs = {
  name: string;
  email: string;
};

export default function BasicForm() {
  const { authActions } = useAuthContext();
  const authClasses = useAuthStyles();

  const { register, handleSubmit, errors } = useForm<SignupBasicInputs>({
    mode: "onBlur",
    shouldUnregister: false,
  });

  const mutation = useMutation<void, GrpcError, SignupBasicInputs>(
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
          {NAME_LABEL}
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
                message: NAME_EMPTY,
                value: nameValidationPattern,
              },
              required: NAME_REQUIRED,
            });
          }}
          helperText={errors?.name?.message ?? " "}
          error={!!errors?.name?.message}
        />
        <InputLabel className={authClasses.formLabel} htmlFor="email">
          {EMAIL_LABEL}
        </InputLabel>
        <TextField
          id="email"
          fullWidth
          className={authClasses.formField}
          name="email"
          variant="standard"
          inputRef={register({
            pattern: {
              message: EMAIL_EMPTY,
              value: emailValidationPattern,
            },
            required: EMAIL_REQUIRED,
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
          {CONTINUE}
        </Button>
      </form>
    </>
  );
}
