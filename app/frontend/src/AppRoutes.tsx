import React, { useEffect } from "react";
import { Switch, Route, RouteProps, Redirect } from "react-router-dom";
import Login from "./features/auth/login/Login";
import ProfilePage from "./features/profile/ProfilePage";
import Home from "./features/Home";
import Messages from "./features/Messages";
import Logout from "./features/auth/Logout";
import Signup from "./features/auth/signup/Signup";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./reducers";
import { authError } from "./features/auth/authSlice";
import UserPage from "./features/userPage/UserPage";
import SearchPage from "./features/search/SearchPage";
import Jail from "./features/auth/jail/Jail";
import TOS from "./components/TOS";

export const loginRoute = "/login";
export const loginPasswordRoute = `${loginRoute}/password`;

export const signupRoute = "/signup";
export const profileRoute = "/profile";
export const messagesRoute = "/messages";
export const requestsRoute = "/messages";
export const logoutRoute = "/logout";

export const userRoute = "/user";
export const searchRoute = "/search";
export const jailRoute = "/restricted";
export const tosRoute = "/tos";

export default function AppRoutes() {
  return (
    <Switch>
      <Route path={`${loginRoute}/:urlToken?`}>
        <Login />
      </Route>
      <Route path={`${signupRoute}/:urlToken?`}>
        <Signup />
      </Route>
      <Route path={tosRoute}>
        <TOS />
      </Route>
      <PrivateRoute path={profileRoute}>
        <ProfilePage />
      </PrivateRoute>
      <PrivateRoute path={messagesRoute}>
        <Messages />
      </PrivateRoute>
      <PrivateRoute path={`${userRoute}/:username`}>
        <UserPage />
      </PrivateRoute>
      <PrivateRoute path={`${searchRoute}/:query?`}>
        <SearchPage />
      </PrivateRoute>
      <PrivateRoute path={jailRoute}>
        <Jail />
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
const PrivateRoute = ({ children, ...otherProps }: RouteProps) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector<RootState, boolean>(
    (state) => state.auth.authToken !== null
  );
  const isJailed = useSelector<RootState, boolean>(
    (state) => state.auth.jailed
  );
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(authError("Please log in."));
    }
  });

  return (
    <>
      <Route {...otherProps}>
        {!isAuthenticated && <Redirect to={loginRoute} />}
        {isJailed && <Redirect to={jailRoute} />}
        {children}
      </Route>
    </>
  );
};
