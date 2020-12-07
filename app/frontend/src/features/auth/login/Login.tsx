import { Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import {
  Redirect,
  Route,
  Switch,
  useLocation,
  useParams,
} from "react-router-dom";
import { loginPasswordRoute, loginRoute } from "../../../AppRoutes";
import Alert from "../../../components/Alert";
import { useAppDispatch, useTypedSelector } from "../../../store";
import { tokenLogin } from "../authActions";
import PasswordForm from "./PasswordForm";
import UsernameForm from "./UsernameForm";

export default function Login() {
  const dispatch = useAppDispatch();
  const authenticated = useTypedSelector((state) => state.auth.authenticated);
  const error = useTypedSelector((state) => state.auth.error);

  const location = useLocation<undefined | { from: Location }>();
  const redirectTo = location.state?.from?.pathname || "/";
  const { urlToken } = useParams<{ urlToken: string }>();

  useEffect(() => {
    //check for a login token
    if (urlToken && location.pathname !== loginPasswordRoute) {
      dispatch(tokenLogin(urlToken));
    }
  }, [urlToken, dispatch, location.pathname]);

  return (
    <>
      {authenticated && <Redirect to={redirectTo} />}
      <Typography variant="h2">Login</Typography>
      {error && <Alert severity="error">{error}</Alert>}

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
