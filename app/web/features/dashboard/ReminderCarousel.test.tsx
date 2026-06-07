import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import liteUsers from "test/fixtures/liteUsers.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import ReminderCarousel from "./ReminderCarousel";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISSED_REMINDERS_KEY = "dismissedReminders";

const { t } = i18n;

const getReminders = service.account.getReminders as jest.MockedFunction<
  typeof service.account.getReminders
>;

describe("ReminderCarousel", () => {
  beforeEach(() => {
    localStorage.removeItem(DISMISSED_REMINDERS_KEY);
  });

  it("renders nothing when backend returns no reminders", async () => {
    getReminders.mockResolvedValue({ remindersList: [] });

    const { container } = render(<ReminderCarousel />, { wrapper });

    await waitFor(() => expect(getReminders).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one card per reminder returned by the backend", async () => {
    getReminders.mockResolvedValue({
      remindersList: [
        { completeProfileReminder: {} },
        { completeVerificationReminder: {} },
      ],
    });

    render(<ReminderCarousel />, { wrapper });

    expect(
      await screen.findByText(t("dashboard:reminder.complete_profile.title")),
    ).toBeVisible();
    expect(
      screen.getByText(t("dashboard:reminder.strong_verification.title")),
    ).toBeVisible();
  });

  it("shows an error alert when the API call fails", async () => {
    mockConsoleError();
    getReminders.mockRejectedValue(new Error("Failed to fetch reminders"));

    render(<ReminderCarousel />, { wrapper });

    await assertErrorAlert("Failed to fetch reminders");
  });

  it("dismisses a reminder via the dismiss control and persists the choice", async () => {
    const user = userEvent.setup();
    getReminders.mockResolvedValue({
      remindersList: [{ completeProfileReminder: {} }],
    });

    render(<ReminderCarousel />, { wrapper });

    expect(
      await screen.findByText(t("dashboard:reminder.complete_profile.title")),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", {
        name: t("dashboard:reminder.carousel_dismiss_button_a11y"),
      }),
    );

    expect(
      screen.queryByText(t("dashboard:reminder.complete_profile.title")),
    ).not.toBeInTheDocument();

    const stored: Record<string, number> = JSON.parse(
      localStorage.getItem(DISMISSED_REMINDERS_KEY) ?? "{}",
    );
    expect(typeof stored.complete_profile).toBe("number");
  });

  it("does not show a reminder that was dismissed within the last week", async () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem(
      DISMISSED_REMINDERS_KEY,
      JSON.stringify({
        complete_profile: now - 24 * 60 * 60 * 1000,
      }),
    );

    getReminders.mockResolvedValue({
      remindersList: [{ completeProfileReminder: {} }],
    });

    const { container } = render(<ReminderCarousel />, { wrapper });

    await waitFor(() => expect(getReminders).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a reminder again once the dismiss is older than one week", async () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem(
      DISMISSED_REMINDERS_KEY,
      JSON.stringify({
        complete_profile: now - ONE_WEEK_MS - 1,
      }),
    );

    getReminders.mockResolvedValue({
      remindersList: [{ completeProfileReminder: {} }],
    });

    render(<ReminderCarousel />, { wrapper });

    expect(
      await screen.findByText(t("dashboard:reminder.complete_profile.title")),
    ).toBeVisible();
  });

  it("prunes stale dismiss entries from storage when a reminder is dismissed", async () => {
    const user = userEvent.setup();
    const now = 2_000_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem(
      DISMISSED_REMINDERS_KEY,
      JSON.stringify({
        "write_reference:7": now - ONE_WEEK_MS - 1000,
      }),
    );

    getReminders.mockResolvedValue({
      remindersList: [{ completeProfileReminder: {} }],
    });

    render(<ReminderCarousel />, { wrapper });
    await screen.findByText(t("dashboard:reminder.complete_profile.title"));

    await user.click(
      screen.getByRole("button", {
        name: t("dashboard:reminder.carousel_dismiss_button_a11y"),
      }),
    );

    const stored: Record<string, number> = JSON.parse(
      localStorage.getItem(DISMISSED_REMINDERS_KEY) ?? "{}",
    );
    expect(stored["write_reference:7"]).toBeUndefined();
    expect(stored.complete_profile).toBe(now);
  });

  it("dismissing one host request reminder does not dismiss another", async () => {
    const user = userEvent.setup();
    const [alice, bob] = liteUsers;
    getReminders.mockResolvedValue({
      remindersList: [
        {
          respondToHostRequestReminder: {
            hostRequestId: 42,
            surferUser: alice,
          },
        },
        {
          respondToHostRequestReminder: { hostRequestId: 99, surferUser: bob },
        },
      ],
    });

    render(<ReminderCarousel />, { wrapper });

    const aliceTitle = t("dashboard:reminder.respond_to_host_request.title", {
      name: alice.name,
    });
    const bobTitle = t("dashboard:reminder.respond_to_host_request.title", {
      name: bob.name,
    });

    expect(await screen.findByText(aliceTitle)).toBeVisible();
    expect(screen.getByText(bobTitle)).toBeVisible();

    const dismissButtons = screen.getAllByRole("button", {
      name: t("dashboard:reminder.carousel_dismiss_button_a11y"),
    });
    await user.click(dismissButtons[0]);

    expect(screen.queryByText(aliceTitle)).not.toBeInTheDocument();
    expect(screen.getByText(bobTitle)).toBeVisible();
  });
});
