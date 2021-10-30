import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HOSTING_STATUS } from "features/constants";
import { hostingStatusLabels } from "features/profile/constants";
import {
  APPLY_FILTER,
  LAST_ACTIVE,
  LAST_WEEK,
  LOCATION,
  MUST_HAVE_LOCATION,
  NUM_GUESTS,
  PROFILE_KEYWORDS,
} from "features/search/constants";
import useSearchFilters, {
  locationToFilters,
  SearchFilters,
} from "features/search/useSearchFilters";
import { Location } from "history";
import { HostingStatus } from "proto/api_pb";
import { Route } from "react-router-dom";
import hookWrapper, { getHookWrapperWithClient } from "test/hookWrapper";
import { server } from "test/restMock";

import FilterDialog from "./FilterDialog";

const Dialog = ({
  setActiveFilters,
  setLocation,
}: {
  setActiveFilters: (value: SearchFilters) => void;
  setLocation?: (value: Location) => void;
}) => {
  const searchFilters = useSearchFilters("");
  return (
    <>
      <FilterDialog
        isOpen={true}
        onClose={() => {}}
        searchFilters={searchFilters}
      />
      <Route
        path="*"
        render={({ location }) => {
          setLocation?.(location);
          setActiveFilters(searchFilters.active);
          return null;
        }}
      />
    </>
  );
};

describe("FilterDialog", () => {
  //using lots of userEvent.type can be slow
  jest.setTimeout(30000);
  it("Goes to the right url when setting all the filters", async () => {
    server.listen();
    let location: Location;
    let activeFilters: SearchFilters = {};
    render(
      <Dialog
        setLocation={(value) => {
          location = value;
        }}
        setActiveFilters={(value) => {
          activeFilters = value;
        }}
      />,
      {
        wrapper: hookWrapper,
      }
    );

    const locationInput = screen.getByLabelText(LOCATION);
    userEvent.type(locationInput, "tes{enter}");
    const locationItem = await screen.findByText("test city, test country");
    userEvent.click(locationItem);

    const keywordsInput = screen.getByLabelText(PROFILE_KEYWORDS);
    userEvent.type(keywordsInput, "keyword1");

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

    const expectedFilters = {
      location: "test city, test country",
      query: "keyword1",
      lat: 2,
      lng: 1,
      lastActive: 7,
      hostingStatusOptions: [2, 3],
      numGuests: 3,
    };

    userEvent.click(screen.getByRole("button", { name: APPLY_FILTER }));

    await waitFor(() => {
      expect(activeFilters).toMatchObject(expectedFilters);
      expect(locationToFilters(location)).toMatchObject(expectedFilters);
    });

    server.close();
  });

  it("starts with default values from the url and clears successfully", async () => {
    let activeFilters: SearchFilters = {};
    let location: Location;
    render(
      <Dialog
        setActiveFilters={(value) => (activeFilters = value)}
        setLocation={(value) => (location = value)}
      />,
      {
        wrapper: getHookWrapperWithClient({
          initialRouterEntries: [
            "?lastActive=7&location=test+location&lat=2&lng=1&hostingStatusOptions=2&hostingStatusOptions=3&numGuests=3&query=keyword1",
          ],
        }).wrapper,
      }
    );
    await waitFor(() => {
      expect(activeFilters).toMatchObject(locationToFilters(location));
    });

    const locationInput = screen.getByLabelText(LOCATION) as HTMLInputElement;
    const keywordInput = screen.getByLabelText(
      PROFILE_KEYWORDS
    ) as HTMLInputElement;
    const lastActiveInput = screen.getByLabelText(
      LAST_ACTIVE
    ) as HTMLInputElement;
    const hostStatusInput = screen.getByLabelText(
      HOSTING_STATUS
    ) as HTMLInputElement;
    const numGuestsInput = screen.getByLabelText(
      NUM_GUESTS
    ) as HTMLInputElement;

    expect(locationInput).toHaveValue("test location");
    expect(keywordInput).toHaveValue("keyword1");
    expect(lastActiveInput).toHaveValue(LAST_WEEK);
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
    expect(numGuestsInput).toHaveValue(3);

    userEvent.clear(locationInput);
    userEvent.click(lastActiveInput);
    userEvent.click(screen.getByText("Any"));
    userEvent.type(hostStatusInput, "{backspace}{backspace}");
    userEvent.clear(numGuestsInput);

    await waitFor(() => {
      expect(locationInput).toHaveValue("");
      expect(lastActiveInput).toHaveValue("Any");
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
      expect(numGuestsInput).toHaveValue(null);

      expect(activeFilters).toMatchObject({});
    });
  });

  it("doesn't submit if filters are used without location", async () => {
    let activeFilters: SearchFilters = {};
    render(
      <Dialog
        setActiveFilters={(value) => {
          activeFilters = value;
        }}
      />,
      {
        wrapper: hookWrapper,
      }
    );
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

    userEvent.click(screen.getByRole("button", { name: APPLY_FILTER }));
    await waitFor(() => {
      const errors = screen.getAllByText(MUST_HAVE_LOCATION);
      expect(errors).toHaveLength(3);
      expect(activeFilters).toMatchObject({});
    });
  });
});
