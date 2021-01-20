import React, { useEffect } from "react";
import { Switch, Route, RouteProps, Redirect } from "react-router-dom";
import Login from "./features/auth/login/Login";
import Home from "./features/Home";
import Messages from "./features/messages/index";
import Logout from "./features/auth/Logout";
import Signup from "./features/auth/signup/Signup";
import { authError } from "./features/auth/authSlice";
import {
  EditProfilePage,
  EditHostingPreferencePage,
  ProfilePage,
} from "./features/profile";
import MapPage from "./features/map/MapPage";
import UserPage from "./features/userPage/UserPage";
import SearchPage from "./features/search/SearchPage";
import NewPagePage from "./features/communities/NewPagePage";
import PagePage from "./features/communities/PagePage";
import Jail from "./features/auth/jail/Jail";
import TOS from "./components/TOS";
import { useAppDispatch, useTypedSelector } from "./store";

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

export const userRoute = "/user";
export const searchRoute = "/search";
export const jailRoute = "/restricted";
export const tosRoute = "/tos";

export const newPageRoute = "/page/new";
export const pageRoute = "/page";

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
      <PrivateRoute path={newPageRoute}>
        <NewPagePage />
      </PrivateRoute>
      <PrivateRoute path={`${pageRoute}/:pageId/:pageSlug?`}>
        <PagePage />
      </PrivateRoute>
      <Route path={jailRoute}>
        <Jail />
      </Route>
      <PrivateRoute exact path="/">
        <Home />
      </PrivateRoute>
      <Route exact path={logoutRoute}>
        <Logout />
      </Route>
    </Switch>
  );
}

const PrivateRoute = ({ children, ...otherProps }: RouteProps) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.authenticated
  );
  const isJailed = useTypedSelector((state) => state.auth.jailed);
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
