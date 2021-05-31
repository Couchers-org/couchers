import { InputLabel } from "@material-ui/core";
import Button from "components/Button";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import { SignupFlowRes } from "pb/auth_pb";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { service } from "service";

type SignupFeedbackInputs = {};

interface FeedbackFormProps {
  token: string;
  callback: (state: SignupFlowRes.AsObject) => void;
}

export default function FeedbackForm({ token, callback }: FeedbackFormProps) {
  const { authActions } = useAuthContext();

  const [loading, setLoading] = useState(false);

  const authClasses = useAuthStyles();

  const { register, handleSubmit } = useForm<SignupFeedbackInputs>({
    shouldUnregister: false,
  });

  const onSubmit = handleSubmit(async (data: SignupFeedbackInputs) => {
    setLoading(true);
    authActions.clearError();
    try {
      const res = await service.auth.signupFlowFeedback(token);
      callback(res);
    } catch (err) {
      authActions.authError(err.message);
    }
    setLoading(false);
  });

  return (
    <>
      <form className={authClasses.form} onSubmit={onSubmit}>
        TODO FEEDBACK FORM
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
