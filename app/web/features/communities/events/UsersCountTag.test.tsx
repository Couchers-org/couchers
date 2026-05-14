import { render, screen } from "@testing-library/react";

import UsersCountTag from "./UsersCountTag";

describe("UsersCountTag", () => {
  it("renders the group icon and child content", () => {
    const { container } = render(<UsersCountTag>12</UsersCountTag>);

    expect(screen.getByText("12")).toBeVisible();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders arbitrary React node children", () => {
    render(
      <UsersCountTag>
        <span>Attending</span>
      </UsersCountTag>,
    );

    expect(screen.getByText("Attending")).toBeVisible();
  });
});
