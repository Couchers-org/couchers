import { useTabContext } from "@material-ui/lab";
import { render, screen } from "@testing-library/react";
import React from "react";
import { UserTab } from "routes";

import UserTabContext from "./UserTabContext";

const Test = () => {
  const tab = useTabContext();
  return <>{tab?.value}</>;
};

function renderTest(tab: UserTab) {
  render(
    <UserTabContext tab={tab}>
      <Test />
    </UserTabContext>
  );
}

describe("UserTabContext", () => {
  it("accepts 'home' as tab parameter from url path", () => {
    renderTest("home");
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("accepts 'about' as tab parameter from url path", () => {
    renderTest("about");
    expect(screen.getByText("about")).toBeInTheDocument();
  });
});
