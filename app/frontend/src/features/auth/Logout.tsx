import React, { useEffect } from "react";
import { logout } from "./authActions";
import { useAppDispatch, useTypedSelector  } from "../../store";
import { Redirect } from "react-router-dom";
import { loginRoute } from "../../AppRoutes";

export default function Logout() {
  const dispatch = useAppDispatch();
  const authToken = useTypedSelector((state) => state.auth.authToken);

  useEffect(() => {
    if (authToken) {
      dispatch(logout(authToken));
    }
  });

  return <Redirect to={loginRoute} />;
}
