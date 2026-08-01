import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PublicTrip, PublicTripStatus } from "couchers/proto/public_trips_pb";
import mockRouter from "next-router-mock";
import { routeToHostRequest } from "routes";
import { service } from "service";
import community from "test/fixtures/community.json";
import publicTripsFixture from "test/fixtures/publicTrips.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getAccountInfo } from "test/serviceMockDefaults";
import { addDefaultUser, MockedService } from "test/utils";

import PublicTripsSection from "./PublicTripsSection";

// Cast once: the JSON fixture uses only the User fields the card actually reads.
const publicTrips = publicTripsFixture as unknown as PublicTrip.AsObject[];

const { t } = i18n;

// Use the Desktop variants so userEvent interactions (typing into dates) work
// the same way they do in the Create Event tests.
jest.mock("@mui/x-date-pickers", () => ({
  ...jest.requireActual("@mui/x-date-pickers"),
  DatePicker: jest.requireActual("@mui/x-date-pickers").DesktopDatePicker,
}));

const listPublicTripsMock = service.publicTrips
  .listPublicTrips as MockedService<typeof service.publicTrips.listPublicTrips>;
const createPublicTripMock = service.publicTrips
  .createPublicTrip as MockedService<
  typeof service.publicTrips.createPublicTrip
>;
const updatePublicTripMock = service.publicTrips
  .updatePublicTrip as MockedService<
  typeof service.publicTrips.updatePublicTrip
>;
const getAccountInfoMock = service.account.getAccountInfo as MockedService<
  typeof service.account.getAccountInfo
>;
const createHostRequestMock = service.requests
  .createHostRequest as MockedService<
  typeof service.requests.createHostRequest
>;

// Use a real fixture description to satisfy the 150-utf16 min-length check.
const VALID_DESCRIPTION = publicTrips[0].description;

// MMDDYYYY strings a few days / a week out from real-today, for typing into
// the desktop date picker. Not frozen, since MUI Dialog transitions don't
// advance under jest fake timers.
function dateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return {
    keystrokes: `${mm}${dd}${yyyy}`,
    isoDate: `${yyyy}-${mm}-${dd}`,
  };
}

// The fixture trips use static (now-past) dates; an offerable trip must be
// active and in the future so its Offer-to-host button isn't dimmed/disabled.
function activeTrip(trip: PublicTrip.AsObject): PublicTrip.AsObject {
  return {
    ...trip,
    status: PublicTripStatus.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
    fromDate: dateOffset(7).isoDate,
    toDate: dateOffset(14).isoDate,
  };
}

describe("PublicTripsSection", () => {
  beforeEach(() => {
    addDefaultUser();
    getAccountInfoMock.mockImplementation(getAccountInfo);
    listPublicTripsMock.mockResolvedValue({
      publicTripsList: publicTrips,
      nextPageToken: "",
    });
  });

  describe("listing", () => {
    it("renders public trips for the community", async () => {
      render(<PublicTripsSection community={community} />, { wrapper });

      // Each fixture trip shows up by its traveler's name; Funny Kid is unique
      // whereas Funny Dog appears twice in the fixture.
      expect(await screen.findByText("Funny Kid")).toBeVisible();
      expect(screen.getAllByText("Funny Dog")).toHaveLength(2);
      expect(screen.getByText("Funny Chicken")).toBeVisible();

      expect(listPublicTripsMock).toHaveBeenCalledWith({
        communityId: community.communityId,
        pageToken: undefined,
        pageSize: 10,
      });
    });

    it("shows the same-gender-only indicator on trips that have sameGenderOnly set", async () => {
      render(<PublicTripsSection community={community} />, { wrapper });

      // Trips 1 and 4 in the fixture both have sameGenderOnly: true
      const indicators = await screen.findAllByText(
        t("publicTrips:same_gender_only_indicator"),
      );
      expect(indicators).toHaveLength(2);
      indicators.forEach((el) => expect(el).toBeVisible());
    });

    it("shows an empty-state message when there are no trips", async () => {
      listPublicTripsMock.mockResolvedValue({
        publicTripsList: [],
        nextPageToken: "",
      });

      render(<PublicTripsSection community={community} />, { wrapper });

      expect(
        await screen.findByText(t("publicTrips:empty_state")),
      ).toBeVisible();
    });
  });

  describe("create", () => {
    beforeEach(() => {
      // Default user (id 1) owns one trip in the full fixture, which would
      // trigger the "Edit my public trips" button instead of "Create".
      // For the create-flow tests we need them to NOT own any trip.
      listPublicTripsMock.mockResolvedValue({
        publicTripsList: publicTrips.filter((t) => t.user?.userId !== 1),
        nextPageToken: "",
      });
      createPublicTripMock.mockResolvedValue(publicTrips[0]);
    });

    it("opens the create dialog with the community name pre-filled", async () => {
      render(<PublicTripsSection community={community} />, { wrapper });
      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", {
          name: t("publicTrips:create_trip"),
        }),
      );

      const dialog = await screen.findByRole("dialog");
      expect(dialog).toHaveTextContent(t("publicTrips:create_dialog_title"));
      // Location label + community name should both render inside the dialog
      expect(dialog).toHaveTextContent(t("publicTrips:location_label"));
      expect(dialog).toHaveTextContent(community.name);
    });

    it("shows the profile-incomplete dialog instead when profile isn't complete", async () => {
      getAccountInfoMock.mockImplementation(async () => ({
        ...(await getAccountInfo()),
        profileComplete: false,
      }));

      render(<PublicTripsSection community={community} />, { wrapper });
      const user = userEvent.setup();

      // Wait for accountInfo to resolve so the handler picks it up
      await screen.findByRole("button", {
        name: t("publicTrips:create_trip"),
      });

      await user.click(
        screen.getByRole("button", {
          name: t("publicTrips:create_trip"),
        }),
      );

      // Profile-incomplete dialog uses the "create a public trip" action text
      expect(
        await screen.findByText(
          /complete your profile/i,
          { selector: "h2" }, // DialogTitle
        ),
      ).toBeVisible();
      // The create-trip form should NOT be present (description textarea is
      // unique to it, unlike the "Create public trip" text which also labels
      // the button that triggered this flow).
      expect(
        screen.queryByLabelText(t("publicTrips:description_label")),
      ).not.toBeInTheDocument();
    });

    it("blocks submission of a description shorter than the minimum", async () => {
      render(<PublicTripsSection community={community} />, { wrapper });
      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", {
          name: t("publicTrips:create_trip"),
        }),
      );

      const descriptionField = await screen.findByLabelText(
        t("publicTrips:description_label"),
      );
      await user.type(descriptionField, "too short");

      await user.click(
        screen.getByRole("button", {
          name: t("publicTrips:create_dialog_submit"),
        }),
      );

      // Service should NOT have been called — form validation blocked it
      expect(createPublicTripMock).not.toHaveBeenCalled();
    });

    it.skip("submits valid form data to createPublicTrip and closes the dialog", async () => {
      render(<PublicTripsSection community={community} />, { wrapper });
      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", {
          name: t("publicTrips:create_trip"),
        }),
      );

      // Arrival / departure dates via the desktop date picker's typed entry.
      // MUI DesktopDatePicker exposes a role="group" wrapper per field.
      const arrival = dateOffset(5);
      const departure = dateOffset(10);

      const arrivalGroup = await screen.findByRole("group", {
        name: t("publicTrips:from_date_label"),
      });
      await user.click(arrivalGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard(arrival.keystrokes);

      const departureGroup = await screen.findByRole("group", {
        name: t("publicTrips:to_date_label"),
      });
      await user.click(departureGroup);
      await user.keyboard("{Control>}a{/Control}");
      await user.keyboard(departure.keystrokes);

      await user.type(
        screen.getByLabelText(t("publicTrips:description_label")),
        VALID_DESCRIPTION,
      );

      await user.click(
        screen.getByRole("button", {
          name: t("publicTrips:create_dialog_submit"),
        }),
      );

      await waitFor(() => {
        expect(createPublicTripMock).toHaveBeenCalledTimes(1);
      });
      expect(createPublicTripMock).toHaveBeenCalledWith({
        communityId: community.communityId,
        fromDate: arrival.isoDate,
        toDate: departure.isoDate,
        description: VALID_DESCRIPTION,
        sameGenderOnly: false,
      });

      // Dialog closes on success
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  // TDD placeholders for flows not yet built on the frontend.
  // The backend supports these via UpdatePublicTrip + CreateHostRequest(public_trip_id).

  describe("update", () => {
    it("shows an Edit action on the user's own upcoming trip", async () => {
      render(<PublicTripsSection community={community} />, { wrapper });
      const user = userEvent.setup();

      const moreButton = await screen.findByTestId(
        "public-trip-6-more-options",
      );
      await user.click(moreButton);

      expect(
        await screen.findByRole("menuitem", { name: t("publicTrips:edit") }),
      ).toBeVisible();
    });

    it.skip("submits updated dates/description to updatePublicTrip and refetches the list", async () => {
      updatePublicTripMock.mockResolvedValue(publicTrips[5]);
      render(<PublicTripsSection community={community} />, { wrapper });
      const user = userEvent.setup();

      const moreButton = await screen.findByTestId(
        "public-trip-6-more-options",
      );
      await user.click(moreButton);
      await user.click(
        await screen.findByRole("menuitem", { name: t("publicTrips:edit") }),
      );

      const dialog = await screen.findByRole("dialog");
      expect(dialog).toHaveTextContent(t("publicTrips:edit_dialog_title"));

      const descriptionField = within(dialog).getByLabelText(
        t("publicTrips:description_label"),
      );
      await user.clear(descriptionField);
      await user.type(descriptionField, VALID_DESCRIPTION);

      await user.click(
        within(dialog).getByRole("button", {
          name: t("publicTrips:edit_dialog_submit"),
        }),
      );

      await waitFor(() => {
        expect(updatePublicTripMock).toHaveBeenCalledTimes(1);
      });
      expect(updatePublicTripMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId: 6,
          description: VALID_DESCRIPTION,
        }),
      );

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("close / reopen", () => {
    it("calls updatePublicTrip with status=CLOSED when the owner closes a trip", async () => {
      updatePublicTripMock.mockResolvedValue(publicTrips[5]);
      render(<PublicTripsSection community={community} />, { wrapper });
      const user = userEvent.setup();

      const moreButton = await screen.findByTestId(
        "public-trip-6-more-options",
      );
      await user.click(moreButton);
      await user.click(
        await screen.findByRole("menuitem", { name: t("publicTrips:close") }),
      );

      const confirmDialog = await screen.findByRole("dialog");
      expect(confirmDialog).toHaveTextContent(
        t("publicTrips:close_dialog_title"),
      );

      await user.click(
        within(confirmDialog).getByRole("button", {
          name: t("publicTrips:close_dialog_confirm"),
        }),
      );

      await waitFor(() => {
        expect(updatePublicTripMock).toHaveBeenCalledWith({
          tripId: 6,
          status: PublicTripStatus.PUBLIC_TRIP_STATUS_CLOSED,
        });
      });
    });

    it("calls updatePublicTrip with status=SEARCHING_FOR_HOST when the owner reopens a closed trip, then shows close option", async () => {
      const futureDates = {
        fromDate: dateOffset(5).isoDate,
        toDate: dateOffset(30).isoDate,
      };
      const closedFutureTrip = {
        ...publicTrips[5],
        ...futureDates,
        status: PublicTripStatus.PUBLIC_TRIP_STATUS_CLOSED,
      };
      // First load shows the closed trip; after the mutation invalidates the
      // query, the refetch returns it as active (no status override → fixture
      // string value → isClosed=false).
      const searchingTrip = { ...publicTrips[5], ...futureDates };
      listPublicTripsMock.mockResolvedValueOnce({
        publicTripsList: [...publicTrips.slice(0, 5), closedFutureTrip],
        nextPageToken: "",
      });
      listPublicTripsMock.mockResolvedValue({
        publicTripsList: [...publicTrips.slice(0, 5), searchingTrip],
        nextPageToken: "",
      });

      render(<PublicTripsSection community={community} />, { wrapper });
      const user = userEvent.setup();

      await user.click(await screen.findByTestId("public-trip-6-more-options"));
      await user.click(
        await screen.findByRole("menuitem", { name: t("publicTrips:reopen") }),
      );

      await waitFor(() => {
        expect(updatePublicTripMock).toHaveBeenCalledWith({
          tripId: 6,
          status: PublicTripStatus.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
        });
      });

      // After the query refetches with the active trip, the menu switches from
      // "Reopen" back to "Mark as closed".
      await waitFor(() => expect(listPublicTripsMock).toHaveBeenCalledTimes(2));
      await user.click(screen.getByTestId("public-trip-6-more-options"));
      expect(
        await screen.findByRole("menuitem", { name: t("publicTrips:close") }),
      ).toBeVisible();
      expect(
        screen.queryByRole("menuitem", { name: t("publicTrips:reopen") }),
      ).not.toBeInTheDocument();
    });
  });

  describe("offer to host", () => {
    it("shows an 'Already offered' link to the thread on trips the viewer has offered on, and an enabled 'Offer to host' on the rest", async () => {
      const VIEWER_HOST_REQUEST_ID = 555;
      // Trip 1: the viewer already has an offer (host request 555).
      // Trip 2: no offer (viewerHostRequestId 0).
      listPublicTripsMock.mockResolvedValue({
        publicTripsList: [
          {
            ...activeTrip(publicTrips[0]),
            viewerHostRequestId: VIEWER_HOST_REQUEST_ID,
          },
          { ...activeTrip(publicTrips[1]), viewerHostRequestId: 0 },
        ],
        nextPageToken: "",
      });

      render(<PublicTripsSection community={community} />, { wrapper });

      // Wait for the cards to render.
      await screen.findByRole("link", {
        name: t("publicTrips:already_offered"),
      });
      const tripAlreadyOffered = document.getElementById("trip-1")!;
      // It's a link to the existing offer thread, not an offer button.
      const link = within(tripAlreadyOffered).getByRole("link", {
        name: t("publicTrips:already_offered"),
      });
      expect(link).toHaveAttribute(
        "href",
        routeToHostRequest(VIEWER_HOST_REQUEST_ID),
      );
      expect(
        within(tripAlreadyOffered).queryByRole("button", {
          name: t("publicTrips:offer_to_host"),
        }),
      ).not.toBeInTheDocument();

      // A different active trip the viewer hasn't offered on shows an enabled
      // offer button.
      const tripNotOffered = document.getElementById("trip-2")!;
      expect(
        within(tripNotOffered).getByRole("button", {
          name: t("publicTrips:offer_to_host"),
        }),
      ).toBeEnabled();
    });

    it("opens the offer form and submits createHostRequest with the public trip linked, then redirects to the thread", async () => {
      const HOST_REQUEST_ID = 99;
      createHostRequestMock.mockResolvedValue(HOST_REQUEST_ID);
      // A single active trip owned by user 2.
      listPublicTripsMock.mockResolvedValue({
        publicTripsList: [activeTrip(publicTrips[0])],
        nextPageToken: "",
      });

      render(<PublicTripsSection community={community} />, { wrapper });
      const user = userEvent.setup();

      // Trip 1 is owned by user 2, so the default user (1) sees the offer button.
      await screen.findAllByRole("button", {
        name: t("publicTrips:offer_to_host"),
      });
      const tripCard = document.getElementById("trip-1")!;
      await user.click(
        within(tripCard).getByRole("button", {
          name: t("publicTrips:offer_to_host"),
        }),
      );

      const dialog = await screen.findByRole("dialog");
      // Dates are pre-filled from the trip; just supply a long enough message.
      const message = within(dialog).getByLabelText(
        t("publicTrips:offer_dialog_message_label"),
        { selector: "textarea" },
      );
      const text = "a".repeat(260);
      fireEvent.change(message, { target: { value: text } });

      await user.click(
        within(dialog).getByRole("button", {
          name: t("publicTrips:offer_dialog_submit"),
        }),
      );

      await waitFor(() => {
        expect(createHostRequestMock).toHaveBeenCalledWith(
          expect.objectContaining({
            hostUserId: 2,
            publicTripId: 1,
            text,
          }),
        );
      });
      // Redirects to the created host request thread.
      await waitFor(() => {
        expect(mockRouter.asPath).toBe(routeToHostRequest(HOST_REQUEST_ID));
      });
    });

    it("disables the offer button on a closed or past trip", async () => {
      // Closed/past trips are normally filtered out of the list, but guard the
      // race where a trip closes/expires while its card is on screen.
      listPublicTripsMock.mockResolvedValue({
        publicTripsList: [
          {
            ...publicTrips[0],
            status: PublicTripStatus.PUBLIC_TRIP_STATUS_CLOSED,
          },
        ],
        nextPageToken: "",
      });

      render(<PublicTripsSection community={community} />, { wrapper });

      expect(
        await screen.findByRole("button", {
          name: t("publicTrips:offer_to_host"),
        }),
      ).toBeDisabled();
    });
  });
});
