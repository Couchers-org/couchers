import React from "react";
import { useEffect } from "react";
import { logout } from "./authSlice";
import { useAppDispatch } from "../../store";
import { Redirect } from "react-router-dom";
import { loginRoute } from "../../AppRoutes";

export default function Logout() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(logout());
  });

  return <Redirect to={loginRoute} />;
}
