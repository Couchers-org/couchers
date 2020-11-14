import React from "react";
import { useForm } from "react-hook-form";
import { Redirect, useHistory, useLocation } from "react-router-dom";
import { loginRoute } from "../../../AppRoutes";
import Button from "../../../components/Button";
import TextInput from "../../../components/TextField";
import { useAppDispatch, useTypedSelector } from "../../../store";
import { passwordLogin } from "../authActions";
import { clearError } from "../authSlice";

export default function PasswordForm() {
  const dispatch = useAppDispatch();
  const authLoading = useTypedSelector((state) => state.auth.loading);

  const { handleSubmit, register } = useForm<{ password: string }>();
  const history = useHistory();
  const location = useLocation<{ username: string }>();

  const onSubmit = handleSubmit(async (data: { password: string }) => {
    dispatch(
      passwordLogin({
        username: location.state.username,
        password: data.password,
      })
    );
  });

  const backClicked = () => {
    dispatch(clearError());
    history.push(loginRoute, location.state);
  };

  return (
    <>
      {!location.state.username && <Redirect to={loginRoute} />}
      <form onSubmit={onSubmit}>
        <TextInput
          label="Username/email"
          value={location.state.username}
          disabled
        ></TextInput>
        <TextInput
          label="Password"
          name="password"
          inputRef={register({ required: true })}
          type="password"
        ></TextInput>
        <Button onClick={backClicked}>Back</Button>
        <Button onClick={onSubmit} loading={authLoading} type="submit">
          Log in
        </Button>
      </form>
    </>
  );
}
