import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import React from "react";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService, t } from "test/utils";

import AdminPanelUserButton from "./AdminPanelUserButton";

const setErrorMock = jest.fn();

const getAccountInfoMock = service.account.getAccountInfo as MockedService<
  typeof service.account.getAccountInfo
>;

const baseAccountInfo = {
  username: "tester",
  email: "email@couchers.org",
  profileComplete: true,
  phone: "+46701740605",
  phoneVerified: true,
  timezone: "Australia/Broken_Hill",
  hasStrongVerification: false,
  birthdateVerificationStatus: 1,
  genderVerificationStatus: 3,
  doNotEmail: false,
  hasDonated: false,
};

describe("AdminPanelUserButton", () => {
  beforeEach(() => {
    setErrorMock.mockClear();
    process.env.NEXT_PUBLIC_CONSOLE_BASE_URL = "http://localhost:3000";
  });

  it("shows the button if the user is a superuser", async () => {
    getAccountInfoMock.mockResolvedValue({
      ...baseAccountInfo,
      isSuperuser: true,
    });
    render(<AdminPanelUserButton username={"test"} />, { wrapper });

    await waitFor(() => {
      expect(getAccountInfoMock).toHaveBeenCalledTimes(1);
    });

    const button = screen.getByRole("button", {
      name: t("profile:view_in_admin_console"),
    });

    await waitFor(() => {
      expect(button).toBeVisible();
    });

    userEvent.click(button);
    await waitFor(() => expect(mockRouter.pathname).toBe("/admin/user/test"));
  });

  it("hides the button if the user is not a superuser", async () => {
    getAccountInfoMock.mockResolvedValue({
      ...baseAccountInfo,
      isSuperuser: false,
    });
    render(<AdminPanelUserButton username={"test"} />, { wrapper });

    await waitFor(() => {
      expect(getAccountInfoMock).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.queryByText(t("profile:view_in_admin_console"))
    ).not.toBeInTheDocument();
  });
});
