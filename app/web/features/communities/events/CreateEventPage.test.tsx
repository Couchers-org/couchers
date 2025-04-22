import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { routeToEvent, routeToNewEvent } from "routes";
import { service } from "service";
import events from "test/fixtures/events.json";
import wrapper, { getHookWrapperWithClient } from "test/hookWrapper";
import i18n from "test/i18n";
import { server } from "test/restMock";
import { MockedService } from "test/utils";

import CreateEventPage from "./CreateEventPage";

const { t } = i18n;

jest.mock("components/MarkdownInput");

jest.mock("@mui/x-date-pickers", () => {
  return {
    ...jest.requireActual("@mui/x-date-pickers"),
    DatePicker: jest.requireActual("@mui/x-date-pickers").DesktopDatePicker,
    TimePicker: jest.requireActual("@mui/x-date-pickers").DesktopTimePicker,
  };
});

const createEventMock = service.events.createEvent as jest.MockedFunction<
  typeof service.events.createEvent
>;

const getAccountInfoMock = service.account.getAccountInfo as MockedService<
  typeof service.account.getAccountInfo
>;

const accountInfo = {
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
  isSuperuser: false,
  uiLanguagePreference: "",
};

describe("Create event page", () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    createEventMock.mockResolvedValue(events[0]);
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-08-01 00:00"));
    getAccountInfoMock.mockResolvedValue(accountInfo);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders and creates an online event successfully", async () => {
    render(<CreateEventPage />, { wrapper });
    const user = userEvent.setup();

    const titleInput = (await screen.findByLabelText(
      t("global:title"),
    )) as HTMLInputElement;

    // @TODO These should be awaited, but it times out with this component. Try again after upgrading jest and mui x-datepickers maybe?

    user.type(titleInput, "Test event");

    await waitFor(() => {
      expect(titleInput).toHaveValue("Test event");
    });

    const startDateField = (await screen.findByLabelText(
      t("communities:start_date"),
    )) as HTMLInputElement;

    user.type(startDateField, "08012021");

    await waitFor(() => {
      expect(startDateField).toHaveValue("08/01/2021");
    });

    const startTimeField = (await screen.findByLabelText(
      t("communities:start_time"),
    )) as HTMLInputElement;

    user.type(startTimeField, "01:00 AM");

    await waitFor(() => {
      expect(startTimeField).toHaveValue("01:00 AM");
    });

    const endDateField = (await screen.findByLabelText(
      t("communities:end_date"),
    )) as HTMLInputElement;

    user.type(endDateField, "08012021");

    await waitFor(() => {
      expect(endDateField).toHaveValue("08/01/2021");
    });

    const endTimeField = screen.getByLabelText(
      t("communities:end_time"),
    ) as HTMLInputElement;

    user.type(endTimeField, "02:00 AM");

    await waitFor(() => expect(endTimeField).toHaveValue("02:00 AM"));

    const virtualEventCheckBox = screen.getByLabelText(
      t("communities:virtual_event"),
    ) as HTMLInputElement;

    user.click(virtualEventCheckBox);

    await waitFor(() => {
      expect(virtualEventCheckBox.checked).toBe(true);
    });

    const eventLinkInput = (await screen.findByLabelText(
      t("communities:event_link"),
    )) as HTMLInputElement;

    user.type(eventLinkInput, "https://couchers.org/social");

    await waitFor(
      () => {
        expect(screen.getByLabelText(t("communities:event_link"))).toHaveValue(
          "https://couchers.org/social",
        );
      },
      { timeout: 5000 },
    );

    user.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!",
    );

    await waitFor(
      () => {
        expect(
          screen.getByLabelText(t("communities:event_details")),
        ).toHaveValue("sick social!");
      },
      { timeout: 5000 },
    );

    user.click(screen.getByRole("button", { name: t("global:create") }));

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(1);
    });

    expect(createEventMock).toHaveBeenCalledWith({
      isOnline: true,
      title: "Test event",
      content: "sick social!",
      photoKey: "",
      startTime: new Date("2021-08-01 01:00 AM"),
      endTime: new Date("2021-08-01 02:00 AM"),
      parentCommunityId: 1,
      link: "https://couchers.org/social",
    });

    // Verifies that success re-directs user
    expect(mockRouter.pathname).toBe(routeToEvent(1, "weekly-meetup"));
  });

  it("creates on offline event with no route state correctly", async () => {
    renderPageWithState();

    const user = userEvent.setup();

    const titleInput = (await screen.findByLabelText(
      t("global:title"),
    )) as HTMLInputElement;

    // @TODO These should be awaited, but it times out with this component. Try again after upgrading jest and mui x-datepickers maybe?
    user.type(titleInput, "Test event");

    await waitFor(() => {
      expect(titleInput).toHaveValue("Test event");
    });

    const startDateField = (await screen.findByLabelText(
      t("communities:start_date"),
    )) as HTMLInputElement;

    user.type(startDateField, "08012021");

    await waitFor(() => {
      expect(startDateField).toHaveValue("08/01/2021");
    });

    const startTimeField = (await screen.findByLabelText(
      t("communities:start_time"),
    )) as HTMLInputElement;

    user.type(startTimeField, "01:00 AM");

    await waitFor(() => {
      expect(startTimeField).toHaveValue("01:00 AM");
    });

    const endDateField = (await screen.findByLabelText(
      t("communities:end_date"),
    )) as HTMLInputElement;

    user.type(endDateField, "08012021");

    await waitFor(() => {
      expect(endDateField).toHaveValue("08/01/2021");
    });

    const endTimeField = screen.getByLabelText(
      t("communities:end_time"),
    ) as HTMLInputElement;

    user.type(endTimeField, "02:00 AM");

    await waitFor(() => expect(endTimeField).toHaveValue("02:00 AM"));

    // msw server response doesn't work with fake timers on, so turn it off temporarily
    jest.useRealTimers();

    const locationInput = screen.getByLabelText(
      t("communities:location"),
    ) as HTMLInputElement;

    user.type(locationInput, "tes{enter}");

    await waitFor(() => {
      expect(locationInput).toHaveValue("tes");
    });

    user.click(await screen.findByText("test city, test county, test country"));

    user.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!",
    );

    await waitFor(() => {
      expect(screen.getByLabelText(t("communities:event_details"))).toHaveValue(
        "sick social!",
      );
    });

    // Now we got our location, turn fake timers back on so the default date we got earlier from the "current"
    // date would pass form validation
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-08-01 00:00"));
    user.click(screen.getByRole("button", { name: t("global:create") }));

    await waitFor(
      () => {
        expect(createEventMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 },
    );

    expect(createEventMock).toHaveBeenCalledWith({
      isOnline: false,
      lat: 2,
      lng: 1,
      address: "test city, test county, test country",
      title: "Test event",
      content: "sick social!",
      photoKey: "",
      startTime: new Date("2021-08-01 01:00 AM"),
      endTime: new Date("2021-08-01 02:00 AM"),
    });
  });

  it("creates on offline event with route state correctly", async () => {
    renderPageWithState({ communityId: 99 });

    const user = userEvent.setup();

    const titleInput = (await screen.findByLabelText(
      t("global:title"),
    )) as HTMLInputElement;

    // @TODO These should be awaited, but it times out with this component. Try again after upgrading jest and mui x-datepickers maybe?
    user.type(titleInput, "Test event");

    await waitFor(() => {
      expect(titleInput).toHaveValue("Test event");
    });

    const startDateField = (await screen.findByLabelText(
      t("communities:start_date"),
    )) as HTMLInputElement;

    user.type(startDateField, "08012021");

    await waitFor(() => {
      expect(startDateField).toHaveValue("08/01/2021");
    });

    const startTimeField = (await screen.findByLabelText(
      t("communities:start_time"),
    )) as HTMLInputElement;

    user.type(startTimeField, "01:00 AM");

    await waitFor(() => {
      expect(startTimeField).toHaveValue("01:00 AM");
    });

    const endDateField = (await screen.findByLabelText(
      t("communities:end_date"),
    )) as HTMLInputElement;

    user.type(endDateField, "08012021");

    await waitFor(() => {
      expect(endDateField).toHaveValue("08/01/2021");
    });

    const endTimeField = screen.getByLabelText(
      t("communities:end_time"),
    ) as HTMLInputElement;

    user.type(endTimeField, "02:00 AM");

    await waitFor(() => expect(endTimeField).toHaveValue("02:00 AM"));

    jest.useRealTimers();

    const locationInput = screen.getByLabelText(
      t("communities:location"),
    ) as HTMLInputElement;

    user.type(locationInput, "tes{enter}");

    await waitFor(() => {
      expect(locationInput).toHaveValue("tes");
    });

    user.click(await screen.findByText("test city, test county, test country"));

    user.type(
      screen.getByLabelText(t("communities:event_details")),
      "sick social!",
    );

    await waitFor(() => {
      expect(screen.getByLabelText(t("communities:event_details"))).toHaveValue(
        "sick social!",
      );
    });

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-08-01 00:00"));
    user.click(screen.getByRole("button", { name: t("global:create") }));

    await waitFor(
      () => {
        expect(createEventMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 },
    );

    expect(createEventMock).toHaveBeenCalledWith({
      isOnline: false,
      lat: 2,
      lng: 1,
      address: "test city, test county, test country",
      title: "Test event",
      content: "sick social!",
      photoKey: "",
      startTime: new Date("2021-08-01 01:00 AM"),
      endTime: new Date("2021-08-01 02:00 AM"),
      parentCommunityId: 99,
    });
  });

  it("shows a profile incomplete dialog if the profile is not complete", async () => {
    getAccountInfoMock.mockResolvedValue({
      username: "tester",
      email: "email@couchers.org",
      profileComplete: false,
      phone: "+46701740605",
      phoneVerified: true,
      timezone: "Australia/Broken_Hill",
      hasStrongVerification: false,
      birthdateVerificationStatus: 1,
      genderVerificationStatus: 3,
      doNotEmail: false,
      hasDonated: false,
      isSuperuser: false,
      uiLanguagePreference: "",
    });

    render(<CreateEventPage />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText(t("dashboard:complete_profile_dialog.title")),
      ).toBeInTheDocument();
    });
  });
});

function renderPageWithState(state?: { communityId: number }) {
  mockRouter.setCurrentUrl(routeToNewEvent(state?.communityId));
  const { wrapper } = getHookWrapperWithClient();
  render(<CreateEventPage />, { wrapper });
}
