import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Route } from "react-router-dom";
import { profileRoute } from "routes";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { addDefaultUser, MockedService } from "test/utils";

import {
  CANCEL,
  MORE_PROFILE_ACTIONS_A11Y_TEXT,
  REPORT_DETAILS,
  REPORT_REASON,
  REPORT_USER,
  SEND,
} from "../constants";
import ProfilePage from "./ProfilePage";

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const reportUserMock = service.user.reportUser as MockedService<
  typeof service.user.reportUser
>;

function renderProfilePage(username?: string) {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [`${profileRoute}${username ? `/${username}` : ""}`],
  });

  render(
    <Route path={`${profileRoute}/:username?`}>
      <ProfilePage />
    </Route>,
    { wrapper }
  );
}

describe("Profile page", () => {
  beforeAll(() => {
    jest.setTimeout(10000);
  });

  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    reportUserMock.mockResolvedValue(new Empty());
    addDefaultUser();
  });

  describe("when viewing the current user's profile", () => {
    it("does not show the button for opening a profile actions menu", async () => {
      renderProfilePage();

      expect(
        await screen.findByRole("heading", { name: "Funny Cat current User" })
      ).toBeVisible();
      expect(
        screen.queryByRole("button", { name: MORE_PROFILE_ACTIONS_A11Y_TEXT })
      ).not.toBeInTheDocument();
    });

    it("does not show the button for opening a profile actions menu (viewed with username)", async () => {
      renderProfilePage("funnycat");

      expect(
        await screen.findByRole("heading", { name: "Funny Cat current User" })
      ).toBeVisible();
      expect(
        screen.queryByRole("button", { name: MORE_PROFILE_ACTIONS_A11Y_TEXT })
      ).not.toBeInTheDocument();
    });
  });

  describe("when viewing another user's profile", () => {
    beforeEach(() => {
      renderProfilePage("funnydog");
    });

    it("shows the button for opening a profile actions menu", async () => {
      expect(
        await screen.findByRole("heading", { name: "Funny Dog" })
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: MORE_PROFILE_ACTIONS_A11Y_TEXT })
      ).toBeVisible();
    });

    it("opens the profile actions menu when the linked button is clicked", async () => {
      userEvent.click(
        await screen.findByRole("button", {
          name: MORE_PROFILE_ACTIONS_A11Y_TEXT,
        })
      );

      expect(await screen.findByRole("menu")).toBeVisible();
    });

    describe("and the 'report user' option is clicked", () => {
      beforeEach(async () => {
        userEvent.click(
          await screen.findByRole("button", {
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
});
