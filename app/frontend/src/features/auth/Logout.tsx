import { useEffect } from "react";
import { logout } from "./authSlice";
import { useAppDispatch, useTypedSelector } from "../../store";
import { tokenLogout } from "./authActions";

export default function Logout() {
	const dispatch = useAppDispatch();
	const authToken = useTypedSelector((state) => state.auth.authToken);

	useEffect(() => {
		if (authToken) {
			tokenLogout(authToken);
		}
		dispatch(logout());
	});

	return null;
}
