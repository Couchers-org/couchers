import { InputLabel, makeStyles } from "@material-ui/core";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

import Button from "../../../components/Button";
import TextBody from "../../../components/TextBody";
import TextField from "../../../components/TextField";
import { SignupRes } from "../../../pb/auth_pb";
import { service } from "../../../service";
import { useAuthContext } from "../AuthProvider";

const useStyles = makeStyles((theme) => ({
  signupForm: {
    display: "flex",
    flexDirection: "column",
    marginBottom: theme.spacing(5),
    width: "100%",
  },
  formField: {},
  formLabel: {
    color: "#333333",
    fontWeight: 700,
  },
  button: {
    marginTop: theme.spacing(4),
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: 700,
  },
}));

export default function EmailForm() {
  const { authActions } = useAuthContext();

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const classes = useStyles();

  const { register, handleSubmit, getValues } = useForm<{ email: string }>({
    shouldUnregister: false,
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setLoading(true);
    authActions.clearError();
    try {
      const next = await service.auth.createEmailSignup(email);
      switch (next) {
        case SignupRes.SignupStep.EMAIL_EXISTS:
          authActions.authError("That email is already in use.");
          break;
        case SignupRes.SignupStep.INVALID_EMAIL:
          authActions.authError("That email isn't valid.");
          break;
        case SignupRes.SignupStep.SENT_SIGNUP_EMAIL:
          setSent(true);
          break;
      }
    } catch (err) {
      authActions.authError(err.message);
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
      <form className={classes.signupForm} onSubmit={onSubmit}>
        <InputLabel className={classes.formLabel} htmlFor="email">
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
            root: classes.button,
            label: classes.buttonText,
          }}
          color="secondary"
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
