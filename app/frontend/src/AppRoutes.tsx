import React, { useEffect } from "react";
import { Switch, Route, RouteProps, Redirect } from "react-router-dom";
import Login from "./features/auth/login/Login";
import Home from "./features/Home";
import Messages from "./features/messages/index";
import Logout from "./features/auth/Logout";
import Signup from "./features/auth/signup/Signup";
import {
  EditProfilePage,
  EditHostingPreferencePage,
  ProfilePage,
} from "./features/profile";
import MapPage from "./features/map/MapPage";
import UserPage from "./features/userPage/UserPage";
import SearchPage from "./features/search/SearchPage";
import Jail from "./features/auth/jail/Jail";
import TOS from "./components/TOS";
import { useAuthContext } from "./features/auth/AuthProvider";
import { ConnectionsPage } from "./features/connections";
import NotFoundPage from "./features/NotFoundPage";

export const loginRoute = "/login";
export const loginPasswordRoute = `${loginRoute}/password`;

export const signupRoute = "/signup";
export const profileRoute = "/profile";
export const editProfileRoute = "/profile/edit";
export const editHostingPreferenceRoute = "/hosting-preference/edit";
export const messagesRoute = "/messages";
export const requestsRoute = "/requests";
export const mapRoute = "/map";
export const logoutRoute = "/logout";
export const connectionsRoute = "/connections";
export const notFoundRoute = "/notfound";

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
      <PrivateRoute path={mapRoute}>
        <MapPage />
      </PrivateRoute>
      <Route path={jailRoute}>
        <Jail />
      </Route>
      <Route exact path={logoutRoute}>
        <Logout />
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
      <PrivateRoute path={`${connectionsRoute}/:type?`}>
        <ConnectionsPage />
      </PrivateRoute>
      <PrivateRoute exact path="/">
        <Home />
      </PrivateRoute>
      <Route exact path={notFoundRoute}>
        <NotFoundPage />
      </Route>
      <Redirect from="*" to={notFoundRoute} />
    </Switch>
  );
}

const PrivateRoute = ({ children, ...otherProps }: RouteProps) => {
  const { authState, authActions } = useAuthContext();
  const isAuthenticated = authState.authenticated;
  const isJailed = authState.jailed;
  useEffect(() => {
    if (!isAuthenticated) {
      authActions.authError("Please log in.");
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
