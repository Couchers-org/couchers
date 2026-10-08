import { render, screen } from "@testing-library/react";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { addDefaultUser, assertErrorAlert, mockConsoleError } from "test/utils";

import UpcomingStays from "./UpcomingStays";

const { t } = i18n;

const listMyUpcomingStaysMock = service.requests.listMyUpcomingStays as jest.MockedFunction<
  typeof service.requests.listMyUpcomingStays
>;

const emptyResponse = { hostRequestsList: [], nextPageToken: "" };

describe("UpcomingStays", () => {
  beforeEach(() => {
    addDefaultUser();
    listMyUpcomingStaysMock.mockResolvedValue(emptyResponse);
  });

  it("shows empty state for both sections when there are no upcoming stays", async () => {
    render(<UpcomingStays />, { wrapper });

    expect(await screen.findByText(t("dashboard:stays.no_upcoming_trips"))).toBeVisible();
    expect(screen.getByText(t("dashboard:stays.no_upcoming_guests"))).toBeVisible();
  });

  it("loads upcoming stays for each role", async () => {
    render(<UpcomingStays />, { wrapper });

    await screen.findByText(t("dashboard:stays.no_upcoming_trips"));

    expect(listMyUpcomingStaysMock).toHaveBeenCalledWith({ role: "hosting" });
    expect(listMyUpcomingStaysMock).toHaveBeenCalledWith({ role: "surfing" });
  });

  it("shows an error alert if requests fail to load", async () => {
    mockConsoleError();
    listMyUpcomingStaysMock.mockRejectedValue(new Error("Failed to load stays"));

    render(<UpcomingStays />, { wrapper });

    await assertErrorAlert("Failed to load stays");
  });
});
