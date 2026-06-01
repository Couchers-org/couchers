import { render, screen } from "@testing-library/react";
import { service } from "service";
import hostRequest from "test/fixtures/hostRequest.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { addDefaultUser, assertErrorAlert, mockConsoleError } from "test/utils";

import UpcomingStays from "./UpcomingStays";

const { t } = i18n;

const listHostRequestsMock = service.requests
  .listHostRequests as jest.MockedFunction<
  typeof service.requests.listHostRequests
>;

const emptyResponse = { hostRequestsList: [], noMore: true, lastRequestId: 0 };

const upcomingTrip = {
  ...hostRequest,
  fromDate: "2099-06-01",
  toDate: "2099-06-05",
  status: 1, // HOST_REQUEST_STATUS_ACCEPTED
  surferUserId: 1,
  hostUserId: 2,
};

describe("UpcomingStays", () => {
  beforeEach(() => {
    addDefaultUser();
    listHostRequestsMock.mockResolvedValue(emptyResponse);
  });

  it("shows empty state for both sections when there are no upcoming stays", async () => {
    render(<UpcomingStays />, { wrapper });

    expect(
      await screen.findByText(t("dashboard:stays.no_upcoming_trips")),
    ).toBeVisible();
    expect(
      screen.getByText(t("dashboard:stays.no_upcoming_guests")),
    ).toBeVisible();
  });

  it("does not show past stays", async () => {
    const pastStay = {
      ...upcomingTrip,
      fromDate: "2000-01-01",
      toDate: "2000-01-05",
    };
    listHostRequestsMock.mockResolvedValue({
      hostRequestsList: [pastStay],
      noMore: true,
      lastRequestId: 0,
    });

    render(<UpcomingStays />, { wrapper });

    expect(
      await screen.findByText(t("dashboard:stays.no_upcoming_trips")),
    ).toBeVisible();
  });

  it("does not show pending requests", async () => {
    const pendingStay = { ...upcomingTrip, status: 0 }; // HOST_REQUEST_STATUS_PENDING
    listHostRequestsMock.mockResolvedValue({
      hostRequestsList: [pendingStay],
      noMore: true,
      lastRequestId: 0,
    });

    render(<UpcomingStays />, { wrapper });

    expect(
      await screen.findByText(t("dashboard:stays.no_upcoming_trips")),
    ).toBeVisible();
  });

  it("shows an error alert if requests fail to load", async () => {
    mockConsoleError();
    listHostRequestsMock.mockRejectedValue(new Error("Failed to load stays"));

    render(<UpcomingStays />, { wrapper });

    await assertErrorAlert("Failed to load stays");
  });
});
