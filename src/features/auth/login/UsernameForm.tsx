import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useHistory, useLocation } from "react-router-dom";
import { loginPasswordRoute, signupRoute } from "../../../AppRoutes";
import Button from "../../../components/Button";
import TextBody from "../../../components/TextBody";
import TextInput from "../../../components/TextField";
import { LoginRes } from "../../../pb/auth_pb";
import { useAppDispatch, useTypedSelector } from "../../../store";
import { authError, clearError } from "../authSlice";
import { checkUsername } from "./lib";

export default function UsernameForm() {
  const dispatch = useAppDispatch();
  const authLoading = useTypedSelector((state) => state.auth.loading);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { handleSubmit, register, setValue } = useForm<{ username: string }>();
  //this username state in the location is in case the back button was pressed from
  //the password form, to avoid re-entering the username
  const location = useLocation<{ username?: string }>();
  const history = useHistory();

  useEffect(() => {
    if (location.state?.username) {
      setValue("username", location.state.username);
    }
  });

  const onSubmit = handleSubmit(async (data: { username: string }) => {
    setLoading(true);
    dispatch(clearError());
    try {
      const next = await checkUsername(data.username);
      switch (next) {
        case LoginRes.LoginStep.INVALID_USER:
          dispatch(authError("Couldn't find that user."));
          break;

        case LoginRes.LoginStep.NEED_PASSWORD:
          history.push(loginPasswordRoute, data);
          //return here to avoid setLoading when
          //this component is no longer mounted
          return;

        case LoginRes.LoginStep.SENT_LOGIN_EMAIL:
          setSent(true);
          break;
      }
    } catch (e) {
      dispatch(authError(e.message));
    }
    setLoading(false);
  });

  if (sent) {
    return <TextBody>Check your email for a link to log in! :)</TextBody>;
  }
  return (
    <>
      <form onSubmit={onSubmit}>
        <TextInput
          label="Username/email"
          name="username"
          inputRef={register({ required: true })}
        ></TextInput>
        <Button
          onClick={onSubmit}
          loading={loading || authLoading}
          type="submit"
        >
          Next
        </Button>
      </form>
      <Link to={signupRoute} component={Button}>
        Create an account
      </Link>
    </>
  );
}
