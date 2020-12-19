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
import { useAuthContext } from "../AuthProvider";
import PasswordForm from "./PasswordForm";
import UsernameForm from "./UsernameForm";

export default function Login() {
  const { authState, authActions } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;

  const location = useLocation<undefined | { from: Location }>();
  const redirectTo = location.state?.from?.pathname || "/";
  const { urlToken } = useParams<{ urlToken: string }>();

  useEffect(() => {
    //check for a login token
    if (urlToken && location.pathname !== loginPasswordRoute) {
      authActions.tokenLogin(urlToken);
    }
  }, [urlToken, authActions, location.pathname]);

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
