import { Typography } from "@material-ui/core";
import React, { useState } from "react";
import { Redirect } from "react-router-dom";
import { useSelector } from "react-redux";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import { RootState } from "../reducers";
import ErrorAlert from "../components/ErrorAlert";
import { passwordLogin } from "../features/auth/authActions";
import { useAppDispatch } from "../store";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const authToken = useSelector<RootState, string | null>(
    (state) => state.auth.authToken
  );
  const error = useSelector<RootState, string | null | undefined>(
    (state) => state.auth.error
  );
  const loading = useSelector<RootState, boolean>(
    (state) => state.auth.loading
  );
  const dispatch = useAppDispatch();

  const login = async () => {
    dispatch(passwordLogin({ username, password }));
  };

  return (
    <>
      {authToken && <Redirect to="/" />}
      <Typography variant="h2">Login</Typography>
      {error && <ErrorAlert error={error} />}
      <TextInput
        label="Username/email"
        onChange={(e) => setUsername(e.target.value)}
        value={username}
      ></TextInput>
      <TextInput
        label="Password"
        onChange={(e) => setPassword(e.target.value)}
        value={password}
        type="password"
      ></TextInput>
      <Button onClick={login} loading={loading}>
        Log in
      </Button>
    </>
  );
}
