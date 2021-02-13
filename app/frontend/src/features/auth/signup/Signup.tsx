import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";

import Alert from "../../../components/Alert";
import PageTitle from "../../../components/PageTitle";
import { signupRoute } from "../../../routes";
import { useAuthContext } from "../AuthProvider";
import CompleteSignupForm from "./CompleteSignupForm";
import EmailForm from "./EmailForm";

export default function Signup() {
  const { authState } = useAuthContext();
  const authenticated = authState.authenticated;
  const error = authState.error;

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
