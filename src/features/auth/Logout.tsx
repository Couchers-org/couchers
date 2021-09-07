import { useEffect } from "react";
import { useQueryClient } from "react-query";
import { Redirect } from "react-router-dom";

import { loginRoute } from "../../routes";
import { useAuthContext } from "./AuthProvider";

export default function Logout() {
  const { authState, authActions } = useAuthContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authState.authenticated) {
      authActions.logout();
      queryClient.resetQueries();
    }
  });

  return <Redirect to={loginRoute} />;
}
