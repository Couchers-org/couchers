import { Typography } from "@material-ui/core";
import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import Alert from "../../../components/Alert";
import EmailForm from "./EmailForm";
import CompleteSignupForm from "./CompleteSignupForm";
import { useTypedSelector } from "../../../store";
import { signupRoute } from "../../../AppRoutes";

export default function Signup() {
  const authToken = useTypedSelector((state) => state.auth.authToken);
  const error = useTypedSelector((state) => state.auth.error);

  return (
    <>
      {authToken && <Redirect to="/" />}
      <Typography variant="h2">Signup</Typography>
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
