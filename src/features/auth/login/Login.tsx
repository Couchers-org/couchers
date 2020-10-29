import { Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import {
  Redirect,
  Route,
  Switch,
  useLocation,
  useParams,
} from "react-router-dom";
import ErrorAlert from "../../../components/ErrorAlert";
import { tokenLogin } from "../authActions";
import { useAppDispatch, useTypedSelector } from "../../../store";
import { loginPasswordRoute, loginRoute } from "../../../AppRoutes";
import UsernameForm from "./UsernameForm";
import PasswordForm from "./PasswordForm";

export default function Login() {
  const dispatch = useAppDispatch();
  const authToken = useTypedSelector((state) => state.auth.authToken);
  const error = useTypedSelector((state) => state.auth.error);

  const location = useLocation();
  const { urlToken } = useParams<{ urlToken: string }>();

  useEffect(() => {
    //check for a login token
    if (urlToken && location.pathname !== loginPasswordRoute) {
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
          <PasswordForm />
        </Route>

        <Route path={loginRoute}>
          <UsernameForm />
        </Route>
      </Switch>
    </>
  );
}
