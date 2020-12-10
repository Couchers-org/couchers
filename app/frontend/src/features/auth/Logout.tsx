import React, { useEffect } from "react";
import { logout } from "./authActions";
import { useAppDispatch, useTypedSelector  } from "../../store";
import { Redirect } from "react-router-dom";
import { loginRoute } from "../../AppRoutes";

export default function Logout() {
  const dispatch = useAppDispatch();
  const authenticated = useTypedSelector((state) => state.auth.authenticated);

  useEffect(() => {
    if (authenticated) {
      dispatch(logout());
    }
  });

  return <Redirect to={loginRoute} />;
}
