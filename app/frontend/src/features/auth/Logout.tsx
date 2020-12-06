import { useEffect } from "react";
import { useAppDispatch, useTypedSelector } from "../../store";
import { logout } from "./authActions";

export default function Logout() {
  const dispatch = useAppDispatch();
  const authToken = useTypedSelector((state) => state.auth.authToken);

  useEffect(() => {
    if (authToken) {
      dispatch(logout(authToken));
    }
  });

  return null;
}
