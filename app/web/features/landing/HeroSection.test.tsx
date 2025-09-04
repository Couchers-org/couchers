import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";

import wrapper from "@/test/hookWrapper";
import i18n from "@/test/i18n";

import HeroSection from "./HeroSection";

const { t } = i18n;

jest.mock("lottie-react", () => ({
  __esModule: true,
  default: () => <div data-testid="lottie-mock" />,
}));

describe("HeroSection", () => {
  it("has a button that navigates to the signup page", async () => {
    render(<HeroSection />, { wrapper });

    const button = screen.getByRole("button", { name: t("global:join_us") });
    expect(button).toBeInTheDocument();

    const user = userEvent.setup();

    await user.click(button);

    expect(mockRouter).toMatchObject({
      asPath: "/signup",
      pathname: "/signup",
    });
  });
});
