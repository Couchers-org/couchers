import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../components/Button";
import TextBody from "../../../components/TextBody";
import TextField from "../../../components/TextField";
import { SignupRes } from "../../../pb/auth_pb";
import { service } from "../../../service";
import { AuthContext, useAppContext } from "../AuthProvider";

export default function EmailForm() {
  const authContext = useAppContext(AuthContext);

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, getValues } = useForm<{ email: string }>({
    shouldUnregister: false,
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setLoading(true);
    authContext.clearError();
    try {
      const next = await service.auth.createEmailSignup(email);
      switch (next) {
        case SignupRes.SignupStep.EMAIL_EXISTS:
          authContext.authError("That email is already in use.");
          break;
        case SignupRes.SignupStep.INVALID_EMAIL:
          authContext.authError("That email isn't valid.");
          break;
        case SignupRes.SignupStep.SENT_SIGNUP_EMAIL:
          setSent(true);
          break;
      }
    } catch (err) {
      authContext.authError(err.message);
    }
    setLoading(false);
  });

  if (sent) {
    return (
      <TextBody>
        A link to continue has been sent to {getValues("email")}.
      </TextBody>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit}>
        <TextField
          name="email"
          label="Email"
          inputRef={register({
            required: true,
          })}
        />
        <Button onClick={onSubmit} loading={loading} type="submit">
          Sign up
        </Button>
      </form>
    </>
  );
}
