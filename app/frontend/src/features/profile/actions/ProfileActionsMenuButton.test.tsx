import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CANCEL,
  MORE_PROFILE_ACTIONS_A11Y_TEXT,
  REPORT_DETAILS,
  REPORT_REASON,
  REPORT_USER,
  SEND,
} from "features/profile/constants";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import { service } from "service";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

import ProfileActionsMenuButton from "./ProfileActionsMenuButton";

const reportUserMock = service.user.reportUser as MockedService<
  typeof service.user.reportUser
>;

describe("profile actions menu", () => {
  beforeEach(() => {
    render(
      <ProfileUserProvider user={users[1]}>
        <ProfileActionsMenuButton />
      </ProfileUserProvider>,
      { wrapper }
    );
  });
  it("opens the profile actions menu when the button is clicked", async () => {
    userEvent.click(
      screen.getByRole("button", {
        name: MORE_PROFILE_ACTIONS_A11Y_TEXT,
      })
    );

    expect(await screen.findByRole("menu")).toBeVisible();
  });

  describe("when the 'report user' option is clicked", () => {
    beforeEach(async () => {
      userEvent.click(
        screen.getByRole("button", {
          name: MORE_PROFILE_ACTIONS_A11Y_TEXT,
        })
      );
      userEvent.click(
        await screen.findByRole("menuitem", { name: REPORT_USER })
      );
    });

    it("opens the report user dialog", async () => {
      expect(
        await screen.findByRole("heading", { name: /Report Funny Dog/i })
      ).toBeVisible();
    });

    it("closes the report user dialog if the 'Cancel' button is clicked", async () => {
      userEvent.click(await screen.findByRole("button", { name: CANCEL }));

      await waitForElementToBeRemoved(
        screen.getByRole("heading", { name: /Report Funny Dog/i })
      );
      expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
    });

    it("reports the user successfully", async () => {
      const reason = "Creepy dog";
      const description = "I feel very comfortable around this creepy dog";
      userEvent.type(await screen.findByLabelText(REPORT_REASON), reason);
      userEvent.type(screen.getByLabelText(REPORT_DETAILS), description);
      userEvent.click(screen.getByRole("button", { name: SEND }));

      const successAlert = await screen.findByRole("alert");
      expect(
        within(successAlert).getByText(
          "Funny Dog has been reported to the Couchers safety team"
        )
      ).toBeVisible();
      expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
      expect(reportUserMock).toHaveBeenCalledTimes(1);
      expect(reportUserMock).toHaveBeenCalledWith({
        description,
        reason,
        userId: 2,
      });
    });

    it("does not submit the user report if the required fields are not filled in", async () => {
      userEvent.click(screen.getByRole("button", { name: SEND }));

      expect(
        await screen.findByRole("heading", { name: /Report Funny Dog/i })
      ).toBeVisible();
      expect(reportUserMock).not.toHaveBeenCalled();
    });

    it("shows an error alert if the report user request failed to submit", async () => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
      reportUserMock.mockRejectedValue(new Error("API error"));
      userEvent.type(await screen.findByLabelText(REPORT_REASON), " ");
      userEvent.type(screen.getByLabelText(REPORT_DETAILS), " ");
      userEvent.click(screen.getByRole("button", { name: SEND }));

      const errorAlert = await screen.findByRole("alert");
      expect(within(errorAlert).getByText("API error")).toBeVisible();
    });
  });
});
