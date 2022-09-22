import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hostingStatusLabels } from "features/profile/constants";
import useRouteWithSearchFilters from "features/search/useRouteWithSearchFilters";
import mockRouter from "next-router-mock";
import { HostingStatus } from "proto/api_pb";
import wrapper from "test/hookWrapper";
import { server } from "test/restMock";
import { t } from "test/utils";
import { parsedQueryToSearchFilters } from "utils/searchFilters";

import FilterDialog from "./FilterDialog";

const Dialog = () => {
  const searchFilters = useRouteWithSearchFilters("");
  return (
    <>
      <FilterDialog
        isOpen={true}
        onClose={() => {}}
        searchFilters={searchFilters}
      />
    </>
  );
};

describe("FilterDialog", () => {
  //using lots of userEvent.type can be slow
  jest.setTimeout(30000);

  beforeEach(() => {
    mockRouter.setCurrentUrl("");
  });

  it("Goes to the right url when setting all the filters", async () => {
    server.listen();
    render(<Dialog />, {
      wrapper,
    });

    const locationInput = screen.getByLabelText(
      t("search:form.location_field_label")
    );
    userEvent.type(locationInput, "tes{enter}");
    const locationItem = await screen.findByText("test city, test country");
    userEvent.click(locationItem);

    const keywordsInput = screen.getByLabelText(
      t("search:form.keywords.field_label")
    );
    userEvent.type(keywordsInput, "keyword1");

    const lastActiveInput = screen.getByLabelText(
      t("search:form.host_filters.last_active_field_label")
    );
    userEvent.click(lastActiveInput);
    userEvent.click(
      screen.getByText(t("search:last_active_options.last_week"))
    );

    const hostStatusInput = screen.getByLabelText(
      t("search:form.host_filters.hosting_status_field_label")
    );
    userEvent.click(hostStatusInput);
    userEvent.click(
      screen.getByText(
        hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_CAN_HOST]
      )
    );
    userEvent.click(hostStatusInput);
    userEvent.click(
      screen.getByText(
        hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_MAYBE]
      )
    );

    const numGuestsInput = screen.getByLabelText(
      t("search:form.accommodation_filters.guests_field_label")
    );
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

    userEvent.click(
      screen.getByRole("button", {
        name: t("search:form.submit_button_label"),
      })
    );

    await waitFor(() => {
      expect(parsedQueryToSearchFilters(mockRouter.query)).toMatchObject(
        expectedFilters
      );
    });

    server.close();
  });

  it("starts with default values from the url and clears successfully", async () => {
    mockRouter.setCurrentUrl(
      "?lastActive=7&location=test+location&lat=2&lng=1&hostingStatusOptions=2&hostingStatusOptions=3&numGuests=3&query=keyword1"
    );
    render(<Dialog />, {
      wrapper,
    });

    const locationInput = screen.getByLabelText(
      t("search:form.location_field_label")
    ) as HTMLInputElement;
    const keywordInput = screen.getByLabelText(
      t("search:form.keywords.field_label")
    ) as HTMLInputElement;
    const lastActiveInput = screen.getByLabelText(
      t("search:form.host_filters.last_active_field_label")
    ) as HTMLInputElement;
    const hostStatusInput = screen.getByLabelText(
      t("search:form.host_filters.hosting_status_field_label")
    ) as HTMLInputElement;
    const numGuestsInput = screen.getByLabelText(
      t("search:form.accommodation_filters.guests_field_label")
    ) as HTMLInputElement;

    expect(locationInput).toHaveValue("test location");
    expect(keywordInput).toHaveValue("keyword1");
    expect(lastActiveInput).toHaveValue(
      t("search:last_active_options.last_week")
    );
    expect(
      screen.getByRole("button", {
        name: hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_CAN_HOST],
      })
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_MAYBE],
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
          name: hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_CAN_HOST],
        })
      ).toBeNull();
      expect(
        screen.queryByRole("button", {
          name: hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_MAYBE],
        })
      ).toBeNull();
      expect(numGuestsInput).toHaveValue(null);

      expect(parsedQueryToSearchFilters(mockRouter.query)).toMatchObject({});
    });
  });

  it("doesn't submit if filters are used without location", async () => {
    render(<Dialog />, {
      wrapper,
    });
    const lastActiveInput = screen.getByLabelText(
      t("search:form.host_filters.last_active_field_label")
    );
    userEvent.click(lastActiveInput);
    userEvent.click(
      screen.getByText(t("search:last_active_options.last_week"))
    );

    const hostStatusInput = screen.getByLabelText(
      t("search:form.host_filters.hosting_status_field_label")
    );
    userEvent.click(hostStatusInput);
    userEvent.click(
      screen.getByText(
        hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_CAN_HOST]
      )
    );
    userEvent.click(hostStatusInput);
    userEvent.click(
      screen.getByText(
        hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_MAYBE]
      )
    );

    const numGuestsInput = screen.getByLabelText(
      t("search:form.accommodation_filters.guests_field_label")
    );
    userEvent.type(numGuestsInput, "3");

    userEvent.click(
      screen.getByRole("button", {
        name: t("search:form.submit_button_label"),
      })
    );
    await waitFor(() => {
      const errors = screen.getAllByText(
        t("search:form.missing_location_validation_error")
      );
      expect(errors).toHaveLength(3);
      expect(parsedQueryToSearchFilters(mockRouter.query)).toMatchObject({});
    });
  });
});
