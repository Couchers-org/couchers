import "utils/dayjs"; // ensure dayjs timezone plugin is registered

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { addDefaultUser, mockConsoleError, MockedService } from "test/utils";

import { ProfileUserProvider } from "../hooks/useProfileUser";
import NewHostRequest from "./NewHostRequest";

const { t } = i18n;

jest.mock("@mui/x-date-pickers", () => ({
  ...jest.requireActual("@mui/x-date-pickers"),
  DatePicker: jest.requireActual("@mui/x-date-pickers").DesktopDatePicker,
}));

jest.mock("features/analytics/hooks", () => ({
  useLogEvent: () => jest.fn(),
}));

jest.mock("features/analytics/foregroundTracker", () => ({
  createForegroundTracker: () => ({
    onVisibilityChange: jest.fn(),
    finalize: () => ({ foregroundMs: 0, totalMs: 0 }),
  }),
}));

jest.mock("features/userQueries/useLiteUsers", () => ({
  useLiteUser: () => ({ isLoading: false, error: null }),
}));

const createHostRequestMock = service.requests
  .createHostRequest as MockedService<
  typeof service.requests.createHostRequest
>;

const [, hostUser] = users; // funnydog, userId=2

const LONG_TEXT = "a".repeat(250);

function renderNewHostRequest() {
  render(
    <ProfileUserProvider user={hostUser}>
      <NewHostRequest
        setIsRequestSuccess={jest.fn()}
        setIsRequesting={jest.fn()}
      />
    </ProfileUserProvider>,
    { wrapper },
  );
}

describe("NewHostRequest", () => {
  beforeEach(() => {
    addDefaultUser();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-24"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("preserves form data when the API call fails", async () => {
    mockConsoleError();
    createHostRequestMock.mockRejectedValue(new Error("Network error"));
    renderNewHostRequest();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const arrivalGroup = await screen.findByRole("group", {
      name: t("profile:request_form.arrival_date"),
    });
    await user.click(arrivalGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("06012026");

    const departureGroup = screen.getByRole("group", {
      name: t("profile:request_form.departure_date"),
    });
    await user.click(departureGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("06052026");

    const textArea = screen.getByLabelText(t("profile:request_form.request"));
    fireEvent.change(textArea, { target: { value: LONG_TEXT } });

    await user.click(screen.getByRole("button", { name: t("global:send") }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Network error");
    expect(textArea).toHaveValue(LONG_TEXT);
  });

  it("rejects an arrival date that is already in the past in the host's timezone", async () => {
    // At 2026-05-24T22:00:00Z it is still May 24 for the requester (UTC), but
    // the host (Europe/Helsinki, UTC+3) is already on May 25.  The requester
    // choosing "today" (May 24) should be treated as a past date and the form
    // should NOT submit to the API.
    jest.setSystemTime(new Date("2026-05-24T22:00:00Z"));

    createHostRequestMock.mockResolvedValue(1);
    render(
      <ProfileUserProvider user={hostUser}>
        <NewHostRequest
          setIsRequestSuccess={jest.fn()}
          setIsRequesting={jest.fn()}
        />
      </ProfileUserProvider>,
      { wrapper },
    );

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    // Type May 24 — today from the requester's perspective, but yesterday in
    // Helsinki where the host lives.
    const arrivalGroup = await screen.findByRole("group", {
      name: t("profile:request_form.arrival_date"),
    });
    await user.click(arrivalGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("05242026");

    const departureGroup = screen.getByRole("group", {
      name: t("profile:request_form.departure_date"),
    });
    await user.click(departureGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("05282026");

    const textArea = screen.getByLabelText(t("profile:request_form.request"));
    fireEvent.change(textArea, { target: { value: LONG_TEXT } });

    await user.click(screen.getByRole("button", { name: t("global:send") }));

    // The form should catch the invalid date before hitting the API.
    expect(createHostRequestMock).not.toHaveBeenCalled();
    // The request text must still be intact so the user doesn't lose their work.
    expect(textArea).toHaveValue(LONG_TEXT);
  });

  it("allows an arrival date that is today in the host's timezone when the requester is ahead", async () => {
    // At 2026-05-25T05:00:00Z it is May 25 in UTC but still May 24 in
    // America/Los_Angeles (UTC-7). Picking May 25 is the host's "tomorrow" —
    // a valid future date that must go through.
    jest.setSystemTime(new Date("2026-05-25T05:00:00Z"));

    createHostRequestMock.mockResolvedValue(1);
    const hostBehindTimezone = { ...users[1], timezone: "America/Los_Angeles" };
    render(
      <ProfileUserProvider user={hostBehindTimezone}>
        <NewHostRequest
          setIsRequestSuccess={jest.fn()}
          setIsRequesting={jest.fn()}
        />
      </ProfileUserProvider>,
      { wrapper },
    );

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const arrivalGroup = await screen.findByRole("group", {
      name: t("profile:request_form.arrival_date"),
    });
    await user.click(arrivalGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("05252026");

    const departureGroup = screen.getByRole("group", {
      name: t("profile:request_form.departure_date"),
    });
    await user.click(departureGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("05302026");

    fireEvent.change(screen.getByLabelText(t("profile:request_form.request")), {
      target: { value: LONG_TEXT },
    });

    await user.click(screen.getByRole("button", { name: t("global:send") }));

    await waitFor(() => expect(createHostRequestMock).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("only sends one request when Send is tapped repeatedly before the response arrives", async () => {
    // On a slow connection the user gets no feedback and keeps tapping; each tap used to create
    // another host request.
    createHostRequestMock.mockImplementation(() => new Promise<number>(() => {}));
    renderNewHostRequest();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const arrivalGroup = await screen.findByRole("group", {
      name: t("profile:request_form.arrival_date"),
    });
    await user.click(arrivalGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("06012026");

    const departureGroup = screen.getByRole("group", {
      name: t("profile:request_form.departure_date"),
    });
    await user.click(departureGroup);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("06052026");

    fireEvent.change(screen.getByLabelText(t("profile:request_form.request")), {
      target: { value: LONG_TEXT },
    });

    const send = screen.getByRole("button", { name: t("global:send") });
    for (let tap = 0; tap < 6; tap++) {
      fireEvent.click(send);
      // let the submit handler settle between taps, as it would between real taps
      await act(async () => {
        await Promise.resolve();
      });
    }

    expect(createHostRequestMock).toHaveBeenCalledTimes(1);
    expect(send).toBeDisabled();
  });
});
