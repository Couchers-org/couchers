import React, { useEffect } from "react";
import { Switch, Route, RouteProps, Redirect } from "react-router-dom";
import Login from "./features/auth/login/Login";
import Home from "./features/Home";
import Messages from "./features/messages/index";
import Logout from "./features/auth/Logout";
import Signup from "./features/auth/signup/Signup";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./reducers";
import { authError } from "./features/auth/authSlice";
import {
  EditProfilePage,
  EditHostingPreferencePage,
  ProfilePage,
} from "./features/profile";
import UserPage from "./features/userPage/UserPage";
import SearchPage from "./features/search/SearchPage";
import Jail from "./features/auth/jail/Jail";
import TOS from "./components/TOS";

export const loginRoute = "/login";
export const loginPasswordRoute = `${loginRoute}/password`;

export const signupRoute = "/signup";
export const profileRoute = "/profile";
export const editProfileRoute = "/profile/edit";
export const editHostingPreferenceRoute = "/hosting-preference/edit";
export const messagesRoute = "/messages";
export const requestsRoute = "/requests";
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
      <PrivateRoute path={editProfileRoute}>
        <EditProfilePage />
      </PrivateRoute>
      <PrivateRoute path={editHostingPreferenceRoute}>
        <EditHostingPreferencePage />
      </PrivateRoute>
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
      <Route
        {...otherProps}
        render={({ location }) =>
          isAuthenticated ? (
            isJailed ? (
              <Redirect to={jailRoute} />
            ) : (
              children
            )
          ) : (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: location },
              }}
            />
          )
        }
      />
    </>
  );
};
