import { InputLabel } from "@material-ui/core";
import Button from "components/Button";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { SignupFlowRes } from "pb/auth_pb";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { service } from "service";
import {
  emailValidationPattern,
  lowercaseAndTrimField,
  nameValidationPattern,
} from "utils/validation";

import {
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

interface BasicFormProps {
  updateState: (state: SignupFlowRes.AsObject) => void;
}

export default function BasicForm({ updateState }: BasicFormProps) {
  const { authActions } = useAuthContext();

  const [loading, setLoading] = useState(false);

  const authClasses = useAuthStyles();

  const { register, handleSubmit, errors } = useForm<SignupBasicInputs>({
    mode: "onBlur",
    shouldUnregister: false,
  });

  const onSubmit = handleSubmit(async (data: SignupBasicInputs) => {
    setLoading(true);
    authActions.clearError();
    try {
      const sanitizedEmail = lowercaseAndTrimField(data.email);
      const res = await service.auth.startSignup(data.name, sanitizedEmail);
      updateState(res);
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
          Continue
        </Button>
      </form>
    </>
  );
}
