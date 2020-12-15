import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { signupRoute } from "../../../AppRoutes";
import Alert from "../../../components/Alert";
import PageTitle from "../../../components/PageTitle";
import { AuthContext, useAppContext } from "../AuthProvider";
import CompleteSignupForm from "./CompleteSignupForm";
import EmailForm from "./EmailForm";

export default function Signup() {
  const authContext = useAppContext(AuthContext);
  const authenticated = authContext.authenticated;
  const error = authContext.error;

  return (
    <>
      {authenticated && <Redirect to="/" />}
      <PageTitle>Signup</PageTitle>
      {error && <Alert severity="error">{error}</Alert>}

      <Switch>
        <Route exact path={`${signupRoute}`}>
          <EmailForm />
        </Route>

        <Route path={`${signupRoute}/:urlToken?`}>
          <CompleteSignupForm />
        </Route>
      </Switch>
    </>
  );
}
