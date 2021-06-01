import { InputLabel } from "@material-ui/core";
import Button from "components/Button";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, errors } = useForm<SignupBasicInputs>({
    mode: "onBlur",
    shouldUnregister: false,
  });

  const onSubmit = handleSubmit(async (data: SignupBasicInputs) => {
    setLoading(true);
    authActions.clearError();
    try {
      const sanitizedEmail = lowercaseAndTrimField(data.email);
      authActions.updateSignupState(
        await service.auth.startSignup(data.name, sanitizedEmail)
      );
    } catch (err) {
      authActions.authError(err.message);
    }
    setLoading(false);
  });

  return (
    <>
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
          inputRef={register({
            pattern: {
              message: NAME_EMPTY,
              value: nameValidationPattern,
            },
            required: NAME_REQUIRED,
          })}
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
          loading={loading}
        >
          {CONTINUE}
        </Button>
      </form>
    </>
  );
}
