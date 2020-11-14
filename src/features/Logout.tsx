import { useEffect } from "react";
import { logout } from "./auth/authSlice";
import { useAppDispatch } from "../store";

export default function Logout() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(logout());
  });

  return null;
}
