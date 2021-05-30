import { useTabContext } from "@material-ui/lab";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";
import { Route } from "react-router-dom";

import UserTabContext from "./UserTabContext";

const Test = () => {
  const tab = useTabContext();
  return <>{tab?.value}</>;
};

function renderTest(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Route path="profile/:tab?">
        <UserTabContext>
          <Test />
        </UserTabContext>
      </Route>
    </MemoryRouter>
  );
}

describe("UserTabContext", () => {
  it("accepts 'home' as tab parameter from url path", () => {
    renderTest("profile/home");
    screen.getByText("home");
  });

  it("accepts 'about' as tab parameter from url path", () => {
    renderTest("profile/about");
    screen.getByText("about");
  });

  it("replaces invalid tab parameters from url path with default 'about'", () => {
    renderTest("profile/foo");
    screen.getByText("about");
  });

  it("uses the default 'about' when there is no tab parameter", () => {
    renderTest("profile");
    screen.getByText("about");
  });
});
