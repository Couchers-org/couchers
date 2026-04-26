import { render, screen, waitFor } from "@testing-library/react";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import ReminderCarousel from "./ReminderCarousel";

const { t } = i18n;

const getReminders = service.account.getReminders as jest.MockedFunction<
  typeof service.account.getReminders
>;

describe("ReminderCarousel", () => {
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
});
