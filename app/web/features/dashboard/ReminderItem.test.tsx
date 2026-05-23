import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReferenceType } from "proto/references_pb";
import liteUsers from "test/fixtures/liteUsers.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import ReminderItem from "./ReminderItem";

const { t } = i18n;

const [, surferUser] = liteUsers;

describe("ReminderItem", () => {
  it("renders a 'respond to host request' card with the surfer's name and a link to the request", () => {
    render(
      <ReminderItem
        reminder={{
          respondToHostRequestReminder: {
            hostRequestId: 42,
            surferUser,
          },
        }}
      />,
      { wrapper },
    );

    expect(
      screen.getByText(
        t("dashboard:reminder.respond_to_host_request.title", {
          name: surferUser.name,
        }),
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        t("dashboard:reminder.respond_to_host_request.description", {
          name: surferUser.name,
        }),
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: t("dashboard:reminder.respond_to_host_request.button"),
      }),
    ).toHaveAttribute("href", "/messages/request/42");
  });

  it("renders a 'write reference' card with the other user's name and a link to leave the reference", () => {
    render(
      <ReminderItem
        reminder={{
          writeReferenceReminder: {
            hostRequestId: 99,
            otherUser: surferUser,
            referenceType: ReferenceType.REFERENCE_TYPE_HOSTED,
          },
        }}
      />,
      { wrapper },
    );

    expect(
      screen.getByText(t("dashboard:reminder.write_reference.title")),
    ).toBeVisible();
    expect(
      screen.getByText(
        t("dashboard:reminder.write_reference.description", {
          name: surferUser.name,
        }),
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: t("dashboard:reminder.write_reference.button"),
      }),
    ).toHaveAttribute(
      "href",
      `/leave-reference/hosted/${surferUser.userId}/99`,
    );
  });

  it("renders a 'complete my home' card with a link to the home edit tab", () => {
    render(<ReminderItem reminder={{ completeMyHomeReminder: {} }} />, {
      wrapper,
    });

    expect(
      screen.getByText(t("dashboard:reminder.complete_my_home.title")),
    ).toBeVisible();
    expect(
      screen.getByText(t("dashboard:reminder.complete_my_home.description")),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: t("dashboard:reminder.complete_my_home.button"),
      }),
    ).toHaveAttribute("href", "/profile/edit/home");
  });

  it("renders a 'complete profile' card with a link to edit the profile", () => {
    render(<ReminderItem reminder={{ completeProfileReminder: {} }} />, {
      wrapper,
    });

    expect(
      screen.getByText(t("dashboard:reminder.complete_profile.title")),
    ).toBeVisible();
    expect(
      screen.getByText(t("dashboard:reminder.complete_profile.description")),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: t("dashboard:reminder.complete_profile.button"),
      }),
    ).toHaveAttribute("href", "/profile/edit");
  });

  it("renders a 'strong verification' card with a link to verify", () => {
    render(<ReminderItem reminder={{ completeVerificationReminder: {} }} />, {
      wrapper,
    });

    expect(
      screen.getByText(t("dashboard:reminder.strong_verification.title")),
    ).toBeVisible();
    expect(
      screen.getByText(t("dashboard:reminder.strong_verification.description")),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: t("dashboard:reminder.strong_verification.button"),
      }),
    ).toHaveAttribute("href", "/strong-verification");
  });

  it("renders nothing for an unrecognised reminder", () => {
    const { container } = render(<ReminderItem reminder={{}} />, { wrapper });

    expect(container).toBeEmptyDOMElement();
  });

  it("calls onDismiss when the dismiss button is clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    render(
      <ReminderItem
        reminder={{ completeProfileReminder: {} }}
        onDismiss={onDismiss}
      />,
      { wrapper },
    );

    await user.click(
      screen.getByRole("button", {
        name: t("dashboard:reminder.carousel_dismiss_button_a11y"),
      }),
    );

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
