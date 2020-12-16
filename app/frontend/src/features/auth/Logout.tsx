import React, { useEffect } from "react";
import { Redirect } from "react-router-dom";
import { loginRoute } from "../../AppRoutes";
import { useAuthContext } from "./AuthProvider";

export default function Logout() {
  const {authState, authActions} = useAuthContext();

  useEffect(() => {
    if (authState.authenticated) {
      authActions.logout();
    }
  });

  return <Redirect to={loginRoute} />;
}
