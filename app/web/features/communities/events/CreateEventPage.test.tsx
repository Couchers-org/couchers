import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { routeToNewEvent } from "routes";
import { service } from "service";
import { Temporal } from "temporal-polyfill";
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

const createEventMock = service.events.createEvent as jest.MockedFunction<typeof service.events.createEvent>;

const getAccountInfoMock = service.account.getAccountInfo as MockedService<typeof service.account.getAccountInfo>;

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
  profilePublicVisibility: 1,
  isVolunteer: false,
  myHomeComplete: false,
  shouldShowDonationBanner: false,
};

describe("Create event page", () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    createEventMock.mockResolvedValue(events[0]);
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-08-01 00:00"));
    getAccountInfoMock.mockResolvedValue(accountInfo);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("creates an event with no route state correctly", async () => {
    renderPageWithState();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await fillRequiredEventFields(user);

    expect(screen.getByLabelText(t("communities:event_details"))).toHaveValue("sick social!");
    await act(async () => user.click(screen.getByRole("button", { name: t("global:create") })));

    expect(createEventMock).toHaveBeenCalledTimes(1);

    expect(createEventMock).toHaveBeenCalledWith({
      lat: 2,
      lng: 1,
      address: "test city, test county, test country",
      title: "Test event",
      content: "sick social!",
      photoKey: undefined,
      startTime: Temporal.PlainDateTime.from("2021-08-01T01:00"),
      endTime: Temporal.PlainDateTime.from("2021-08-01T02:00"),
    });
  });

  it("creates an event with route state correctly", async () => {
    renderPageWithState({ communityId: 99 });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const titleInput = (await screen.findByLabelText(t("communities:event_title_label"))) as HTMLInputElement;

    await user.type(titleInput, "Test event");

    expect(titleInput).toHaveValue("Test event");

    const startDateGroup = await screen.findByRole("group", {
      name: t("communities:start_date"),
    });

    await user.click(startDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("08012021");

    expect(startDateGroup).toHaveTextContent("08/01/2021");

    const startTimeGroup = await screen.findByRole("group", {
      name: t("communities:start_time"),
    });

    await user.click(startTimeGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("01:00 AM");

    expect(startTimeGroup).toHaveTextContent("01:00 am");

    const endDateGroup = await screen.findByRole("group", {
      name: t("communities:end_date"),
    });

    await user.click(endDateGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("08012021");

    expect(endDateGroup).toHaveTextContent("08/01/2021");

    const endTimeGroup = await screen.findByRole("group", {
      name: t("communities:end_time"),
    });

    await user.click(endTimeGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("02:00 AM");

    expect(endTimeGroup).toHaveTextContent("02:00 am");

    const locationInput = screen.getByLabelText(t("communities:location")) as HTMLInputElement;

    await user.type(locationInput, "tes{enter}");

    expect(locationInput).toHaveValue("tes");

    await user.click(await screen.findByText("test city, test county, test country"));

    await user.type(screen.getByLabelText(t("communities:event_details")), "sick social!");

    expect(screen.getByLabelText(t("communities:event_details"))).toHaveValue("sick social!");

    await act(async () => user.click(screen.getByRole("button", { name: t("global:create") })));

    expect(createEventMock).toHaveBeenCalledTimes(1);

    expect(createEventMock).toHaveBeenCalledWith({
      lat: 2,
      lng: 1,
      address: "test city, test county, test country",
      title: "Test event",
      content: "sick social!",
      photoKey: undefined,
      startTime: Temporal.PlainDateTime.from("2021-08-01T01:00"),
      endTime: Temporal.PlainDateTime.from("2021-08-01T02:00"),
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
      profilePublicVisibility: 1,
      isVolunteer: false,
      myHomeComplete: false,
      shouldShowDonationBanner: false,
    });

    render(<CreateEventPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(t("profile:complete_profile_dialog.title"))).toBeInTheDocument();
    });
  });

  it("shows the invite community checkbox unchecked by default", async () => {
    renderPageWithState();

    const checkbox = await screen.findByRole("checkbox", {
      name: t("communities:invite_community_dialog:message_box"),
    });

    expect(checkbox).not.toBeChecked();
  });

  it("creates an event without requesting a community invite by default", async () => {
    renderPageWithState();

    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    await fillRequiredEventFields(user);

    await act(async () => user.click(screen.getByRole("button", { name: t("global:create") })));

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the invite community dialog after creating an event with invite community selected", async () => {
    renderPageWithState();

    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    await fillRequiredEventFields(user);

    await user.click(
      screen.getByRole("checkbox", {
        name: t("communities:invite_community_dialog:message_box"),
      }),
    );

    await act(async () => user.click(screen.getByRole("button", { name: t("global:create") })));

    expect(await screen.findByRole("dialog")).toBeVisible();

    expect(screen.getByText(t("communities:invite_community_dialog.title"))).toBeVisible();
  });
});

function renderPageWithState(state?: { communityId: number }) {
  mockRouter.setCurrentUrl(routeToNewEvent(state?.communityId));
  const { wrapper } = getHookWrapperWithClient();
  render(<CreateEventPage />, { wrapper });
}

async function fillRequiredEventFields(user: ReturnType<typeof userEvent.setup>) {
  const titleInput = (await screen.findByLabelText(t("communities:event_title_label"))) as HTMLInputElement;

  await user.type(titleInput, "Test event");

  const startDateGroup = await screen.findByRole("group", {
    name: t("communities:start_date"),
  });

  await user.click(startDateGroup);
  await user.keyboard("{Control>}a{/Control}");
  await user.keyboard("08012021");

  const startTimeGroup = await screen.findByRole("group", {
    name: t("communities:start_time"),
  });

  await user.click(startTimeGroup);
  await user.keyboard("{Control>}a{/Control}");
  await user.keyboard("01:00 AM");

  const endDateGroup = await screen.findByRole("group", {
    name: t("communities:end_date"),
  });

  await user.click(endDateGroup);
  await user.keyboard("{Control>}a{/Control}");
  await user.keyboard("08012021");

  const endTimeGroup = await screen.findByRole("group", {
    name: t("communities:end_time"),
  });

  await user.click(endTimeGroup);
  await user.keyboard("{Control>}a{/Control}");
  await user.keyboard("02:00 AM");

  const locationInput = screen.getByLabelText(t("communities:location")) as HTMLInputElement;

  await user.type(locationInput, "tes{enter}");

  await user.click(await screen.findByText("test city, test county, test country"));

  const detailsInput = screen.getByLabelText(t("communities:event_details"));

  await user.type(detailsInput, "sick social!");
}
