import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HOSTING_STATUS } from "features/constants";
import { hostingStatusLabels } from "features/profile/constants";
import {
  APPLY_FILTER,
  LAST_ACTIVE,
  LAST_WEEK,
  LOCATION,
  NUM_GUESTS,
} from "features/search/constants";
import { HostingStatus } from "pb/api_pb";
import { Route } from "react-router-dom";
import hookWrapper from "test/hookWrapper";
import { server } from "test/restMock";

import FilterDialog from "./FilterDialog";

const renderDialog = (
  mutableParams: URLSearchParams,
  setSearchQuery?: (value: string) => void
) => {
  render(
    <>
      <FilterDialog
        isOpen={true}
        onClose={() => {}}
        searchParams={mutableParams}
      />
      <Route
        path="*"
        render={({ location }) => {
          setSearchQuery?.(location.search);
          return null;
        }}
      />
    </>,
    {
      wrapper: hookWrapper,
    }
  );
};

describe("FilterDialog", () => {
  it("Goes to the right url when setting all the filters", async () => {
    server.listen();
    const params = new URLSearchParams();
    let locationQuery = "";
    renderDialog(params, (value) => {
      locationQuery = value;
    });

    const locationInput = screen.getByLabelText(LOCATION);
    userEvent.type(locationInput, "tes{enter}");
    const locationItem = await screen.findByText("test city, test country");
    userEvent.click(locationItem);

    const lastActiveInput = screen.getByLabelText(LAST_ACTIVE);
    userEvent.click(lastActiveInput);
    userEvent.click(screen.getByText(LAST_WEEK));

    const hostStatusInput = screen.getByLabelText(HOSTING_STATUS);
    userEvent.click(hostStatusInput);
    userEvent.click(
      screen.getByText(
        hostingStatusLabels[HostingStatus.HOSTING_STATUS_CAN_HOST]
      )
    );
    userEvent.click(hostStatusInput);
    userEvent.click(
      screen.getByText(hostingStatusLabels[HostingStatus.HOSTING_STATUS_MAYBE])
    );

    const numGuestsInput = screen.getByLabelText(NUM_GUESTS);
    userEvent.type(numGuestsInput, "3");

    expect(Array.from(params.entries())).toEqual(
      expect.arrayContaining([
        ["location", "test city, test country"],
        ["lat", "2"],
        ["lng", "1"],
        ["lastActive", "7"],
        ["hostingStatus", "2"],
        ["hostingStatus", "3"],
        ["numGuests", "3"],
      ])
    );

    userEvent.click(screen.getByRole("button", { name: APPLY_FILTER }));
    await waitFor(() => {
      expect(locationQuery).toBe(`?${params.toString()}`);
    });

    server.close();
  });

  it("starts with default values from the url and clears successfully", () => {
    const params = new URLSearchParams(
      "lastActive=7&location=test+location&lat=2&lng=1&hostingStatus=2&hostingStatus=3&numGuests=3"
    );
    renderDialog(params);

    const locationInput = screen.getByLabelText(LOCATION) as HTMLInputElement;
    const lastActiveInput = screen.getByLabelText(
      LAST_ACTIVE
    ) as HTMLInputElement;
    const hostStatusInput = screen.getByLabelText(
      HOSTING_STATUS
    ) as HTMLInputElement;
    const numGuestsInput = screen.getByLabelText(
      NUM_GUESTS
    ) as HTMLInputElement;

    expect(locationInput.value).toBe("test location");
    expect(lastActiveInput.value).toBe(LAST_WEEK);
    expect(
      screen.getByRole("button", {
        name: hostingStatusLabels[HostingStatus.HOSTING_STATUS_CAN_HOST],
      })
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: hostingStatusLabels[HostingStatus.HOSTING_STATUS_MAYBE],
      })
    ).toBeVisible();
    expect(numGuestsInput.value).toBe("3");

    userEvent.clear(locationInput);
    userEvent.clear(lastActiveInput);
    userEvent.type(hostStatusInput, "{backspace}{backspace}");
    userEvent.clear(numGuestsInput);

    expect(locationInput.value).toBe("");
    expect(lastActiveInput.value).toBe("");
    expect(
      screen.queryByRole("button", {
        name: hostingStatusLabels[HostingStatus.HOSTING_STATUS_CAN_HOST],
      })
    ).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: hostingStatusLabels[HostingStatus.HOSTING_STATUS_MAYBE],
      })
    ).toBeNull();
    expect(numGuestsInput.value).toBe("");

    expect(Array.from(params.entries())).toEqual(expect.arrayContaining([]));
  });
});
