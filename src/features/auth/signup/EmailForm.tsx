import { Typography } from "@material-ui/core";
import React, { useState } from "react";
import Button from "../../../components/Button";
import TextInput from "../../../components/TextInput";
import { useAppDispatch } from "../../../store";
import { SignupRes } from "../../../pb/auth_pb";
import { authError, clearError } from "../authSlice";
import { createEmailSignup } from "./lib";
import { useForm } from "react-hook-form";

export default function EmailForm() {
  const dispatch = useAppDispatch();

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, getValues } = useForm<{ email: string }>({
    shouldUnregister: false,
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setLoading(true);
    dispatch(clearError());
    try {
      const next = await createEmailSignup(email);
      switch (next) {
        case SignupRes.SignupStep.EMAIL_EXISTS:
          dispatch(authError("That email is already in use."));
          break;
        case SignupRes.SignupStep.INVALID_EMAIL:
          dispatch(authError("That email isn't valid."));
          break;
        case SignupRes.SignupStep.SENT_SIGNUP_EMAIL:
          setSent(true);
          break;
      }
    } catch (err) {
      dispatch(authError(err.message));
    }
    setLoading(false);
  });

  if (sent) {
    return (
      <Typography>
        A link to continue has been sent to {getValues("email")}.
      </Typography>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit}>
        <TextInput
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
