import { InputLabel } from "@material-ui/core";
import Button from "components/Button";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { SignupRes } from "pb/auth_pb";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { service } from "service";
import { sanitizeName } from "utils/validation";

export default function BasicForm() {
  const { authActions } = useAuthContext();

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const authClasses = useAuthStyles();

  const { register, handleSubmit, getValues } = useForm<{ email: string }>({
    shouldUnregister: false,
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setLoading(true);
    authActions.clearError();
    try {
      const sanitizedEmail = sanitizeName(email);
      const next = await service.auth.createEmailSignup(sanitizedEmail);
      setSent(true);
    } catch (err) {
      authActions.authError(err.message);
    }
    setLoading(false);
  });

  if (sent) {
    return (
      <TextBody className={authClasses.feedbackMessage}>
        A link to continue has been sent to {getValues("email")}.
      </TextBody>
    );
  }

  return (
    <>
      <form className={authClasses.form} onSubmit={onSubmit}>
        <InputLabel className={authClasses.formLabel} htmlFor="email">
          Email
        </InputLabel>
        <TextField
          id="email"
          fullWidth
          name="email"
          variant="standard"
          inputRef={register({
            required: true,
          })}
        />
        <Button
          classes={{
            label: authClasses.buttonText,
            root: authClasses.button,
          }}
          onClick={onSubmit}
          type="submit"
          disabled={sent}
          loading={loading}
        >
          Continue
        </Button>
      </form>
    </>
  );
}
