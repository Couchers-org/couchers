import { Add } from "@mui/icons-material";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserSummary from "components/UserSummary";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";

describe("UserSummary", () => {
  it("shouldn't render menu icon when no options set", async () => {
    render(<UserSummary user={users[0]} />, { wrapper });
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("should render functioning menu when options set", async () => {
    const menuOptionText = "Test Menu Option";
    const menuOptionFunc = jest.fn();

    render(
      <UserSummary
        user={users[0]}
        menuItems={[
          { icon: Add, label: menuOptionText, onClick: menuOptionFunc },
        ]}
      />,
      { wrapper },
    );

    const menuButton = await screen.findByRole("button");
    const user = userEvent.setup();

    await user.click(menuButton);
    const menuOption = await screen.findByText(menuOptionText);
    await user.click(menuOption);

    expect(menuOptionFunc.mock.calls.length).toBe(1);
  });

  it("shouldn't render the user's age", async () => {
    render(<UserSummary user={users[0]} />, { wrapper });

    const heading = screen.getByRole("heading");
    expect(heading).toHaveTextContent(users[0].name);
    expect(heading).not.toHaveTextContent(`${users[0].age}`);
  });

  it("should render the location pin alongside the city", async () => {
    render(<UserSummary user={users[0]} />, { wrapper });

    expect(screen.getByTestId("LocationOnIcon")).toBeVisible();
    expect(screen.getByText(users[0].city)).toBeVisible();
  });
});
