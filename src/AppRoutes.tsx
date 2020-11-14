import React, { useEffect } from "react";
import { Switch, Route, RouteProps, Redirect } from "react-router-dom";
import Login from "./features/auth/login/Login";
import ProfilePage from "./features/profile/ProfilePage";
import Home from "./views/Home";
import Messages from "./views/Messages";
import Logout from "./views/Logout";
import Signup from "./features/auth/signup/Signup";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./reducers";
import { authError } from "./features/auth/authSlice";

export const loginRoute = "/login";
export const loginPasswordRoute = `${loginRoute}/password`;

export const signupRoute = "/signup";
export const profileRoute = "/profile";
export const messagesRoute = "/messages";
export const requestsRoute = "/messages";
export const logoutRoute = "/logout";

export default function AppRoutes() {
  return (
    <Switch>
      <Route path={`${loginRoute}/:urlToken?`}>
        <Login />
      </Route>
      <Route path={`${signupRoute}/:urlToken?`}>
        <Signup />
      </Route>
      <PrivateRoute path={profileRoute}>
        <ProfilePage />
      </PrivateRoute>
      <PrivateRoute path={messagesRoute}>
        <Messages />
      </PrivateRoute>
      <PrivateRoute exact path="/">
        <Home />
      </PrivateRoute>
      <PrivateRoute exact path={logoutRoute}>
        <Logout />
      </PrivateRoute>
    </Switch>
  );
}

// TODO: Redirect to requested route after login
const PrivateRoute = (props: RouteProps) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector<RootState, boolean>(
    (state) => state.auth.authToken !== null
  );
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(authError("Please log in."));
    }
  });

  const { children, ...otherProps } = props;

  return (
    <>
      <Route {...otherProps}>
        {!isAuthenticated && <Redirect to="/login" />}
        {children}
      </Route>
    </>
  );
};
