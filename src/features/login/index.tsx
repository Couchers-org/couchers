import { Typography } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import {
  Redirect,
  Route,
  Switch,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";
import Button from "../../components/Button";
import TextInput from "../../components/TextInput";
import ErrorAlert from "../../components/ErrorAlert";
import { passwordLogin, tokenLogin } from "../auth/authActions";
import { useAppDispatch, useTypedSelector } from "../../store";
import { useForm } from "react-hook-form";
import { checkUsername } from "./login";
import { authError, clearError } from "../auth/authSlice";
import { LoginRes } from "../../pb/auth_pb";
import {
  loginPasswordRoute,
  loginRoute,
  loginSentRoute,
} from "../../AppRoutes";

type LoginInputs = {
  username: string;
  password?: string;
};

export default function Login() {
  const dispatch = useAppDispatch();
  const authToken = useTypedSelector((state) => state.auth.authToken);
  const error = useTypedSelector((state) => state.auth.error);
  const authLoading = useTypedSelector((state) => state.auth.loading);

  const [loading, setLoading] = useState(false);

  const history = useHistory();

  const { register, handleSubmit, setValue, getValues } = useForm<LoginInputs>({
    shouldUnregister: false,
  });

  const onSubmit = handleSubmit(async (data: LoginInputs) => {
    if (!data.password) {
      setLoading(true);
      dispatch(clearError());
      try {
        const next = await checkUsername(data.username);
        switch (next) {
          case LoginRes.LoginStep.INVALID_USER:
            throw Error("Couldn't find that user.");

          case LoginRes.LoginStep.NEED_PASSWORD:
            history.push(loginPasswordRoute);
            break;

          case LoginRes.LoginStep.SENT_LOGIN_EMAIL:
            history.push(loginSentRoute);
            break;
        }
      } catch (e) {
        dispatch(authError(e.message));
      }
      setLoading(false);
    } else {
      dispatch(
        passwordLogin({ username: data.username, password: data.password })
      );
    }
  });

  const backClicked = () => {
    dispatch(clearError());
    setValue("password", "");
    history.push(loginRoute);
  };

  const { urlToken } = useParams<{ urlToken: string }>();
  const location = useLocation();
  useEffect(() => {
    //check for a login token
    if (
      urlToken &&
      location.pathname !== loginPasswordRoute &&
      location.pathname !== loginSentRoute
    ) {
      dispatch(tokenLogin(urlToken));
    }
  }, [urlToken, dispatch, location.pathname]);

  return (
    <>
      {authToken && <Redirect to="/" />}
      <Typography variant="h2">Login</Typography>
      {error && <ErrorAlert error={error} />}

      <Switch>
        <Route path={loginPasswordRoute}>
          {!getValues("username") && <Redirect to={loginRoute} />}
          <form onSubmit={onSubmit}>
            <TextInput
              label="Username/email"
              value={getValues("username")}
              //key prevents react thinking this is the same input as the other username field
              key="step2Username"
              disabled
            ></TextInput>
            <TextInput
              label="Password"
              name="password"
              inputRef={register({ required: true })}
              type="password"
            ></TextInput>
            <Button onClick={backClicked}>Back</Button>
            <Button onClick={onSubmit} loading={authLoading}>
              Log in
            </Button>
          </form>
        </Route>

        <Route path={loginSentRoute}>
          {!getValues("username") && <Redirect to={loginRoute} />}
          <Typography key="tokenSentText">
            Check your email for a link to log in! :)
          </Typography>
        </Route>

        <Route path={`${loginRoute}/:urlToken?`}>
          <form onSubmit={onSubmit}>
            <TextInput
              label="Username/email"
              name="username"
              inputRef={register({ required: true })}
              key="step1Username"
            ></TextInput>
            <Button onClick={onSubmit} loading={loading || authLoading}>
              Next
            </Button>
          </form>
        </Route>
      </Switch>
    </>
  );
}
