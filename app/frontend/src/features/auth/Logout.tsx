import React, { useEffect } from "react";
import { Redirect } from "react-router-dom";
import { loginRoute } from "../../AppRoutes";
import { AuthContext, useAppContext } from "./AuthProvider";

export default function Logout() {
  const authContext = useAppContext(AuthContext);

  useEffect(() => {
    if (authContext.authenticated) {
      authContext.logout();
    }
  });

  return <Redirect to={loginRoute} />;
}
