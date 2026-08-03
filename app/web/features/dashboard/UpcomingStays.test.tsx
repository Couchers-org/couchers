import { render, screen } from "@testing-library/react";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { addDefaultUser, assertErrorAlert, mockConsoleError } from "test/utils";

import UpcomingStays from "./UpcomingStays";

const { t } = i18n;

const listHostRequestsMock = service.requests.listHostRequests as jest.MockedFunction<
  typeof service.requests.listHostRequests
>;

const emptyResponse = { hostRequestsList: [], noMore: true, nextPageToken: "" };

describe("UpcomingStays", () => {
  beforeEach(() => {
    addDefaultUser();
    listHostRequestsMock.mockResolvedValue(emptyResponse);
  });

  it("shows empty state for both sections when there are no upcoming stays", async () => {
    render(<UpcomingStays />, { wrapper });

    expect(await screen.findByText(t("dashboard:stays.no_upcoming_trips"))).toBeVisible();
    expect(screen.getByText(t("dashboard:stays.no_upcoming_guests"))).toBeVisible();
  });

  it("filters past and pending stays via API parameters", async () => {
    render(<UpcomingStays />, { wrapper });

    await screen.findByText(t("dashboard:stays.no_upcoming_trips"));

    expect(listHostRequestsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        onlyActive: true,
        statusIn: [1, 3], // HOST_REQUEST_STATUS_ACCEPTED, HOST_REQUEST_STATUS_CONFIRMED
      }),
    );
  });

  it("shows an error alert if requests fail to load", async () => {
    mockConsoleError();
    listHostRequestsMock.mockRejectedValue(new Error("Failed to load stays"));

    render(<UpcomingStays />, { wrapper });

    await assertErrorAlert("Failed to load stays");
  });
});
