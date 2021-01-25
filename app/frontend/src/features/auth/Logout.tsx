import React, { useEffect } from "react";
import { useQueryClient } from "react-query";
import { Redirect } from "react-router-dom";
import { loginRoute } from "../../AppRoutes";
import { useAuthContext } from "./AuthProvider";

export default function Logout() {
  const { authState, authActions } = useAuthContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authState.authenticated) {
      authActions.logout();
      queryClient.resetQueries("groupChats");
      queryClient.resetQueries("groupChatMessages");
      queryClient.resetQueries("hostRequestMessages");
      queryClient.resetQueries("hostRequests");
      queryClient.resetQueries("ping");
    }
  });

  return <Redirect to={loginRoute} />;
}
