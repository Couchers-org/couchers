import React from "react";
import { Switch, Route } from "react-router-dom";
import Home from "./views/home";
import Profile from "./views/profile";
import Messages from "./views/messages";
import Login from "./views/login";

export default function AppRoutes() {
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/profile">
        <Profile />
      </Route>
      <Route path="/messages">
        <Messages />
      </Route>
      <Route path="/">
        <Home />
      </Route>
    </Switch>
  );
}
