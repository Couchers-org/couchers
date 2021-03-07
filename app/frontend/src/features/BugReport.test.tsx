import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mediaQuery from "css-mediaquery";

import { service } from "../service";
import wrapper from "../test/hookWrapper";
import { addDefaultUser, MockedService } from "../test/utils";
import BugReport from "./BugReport";

const reportBugMock = service.bugs.reportBug as MockedService<
  typeof service.bugs.reportBug
>;

afterEach(() => jest.restoreAllMocks);

async function fillInAndSubmitBugReport(
  subjectFieldLabel: string,
  descriptionFieldLabel: string,
  stepsFieldLabel: string = "",
  resultsFieldLabel: string = ""
) {
  const subjectField = await screen.findByLabelText(subjectFieldLabel);
  const descriptionField = await screen.findByLabelText(descriptionFieldLabel);
  const stepsField = screen.queryByLabelText(stepsFieldLabel);
  const resultsField = screen.queryByLabelText(resultsFieldLabel);

  userEvent.type(subjectField, "Broken log in");
  userEvent.type(descriptionField, "Log in is broken");

  if (stepsField) {
    userEvent.type(stepsField, "Type in user name and clicked log in");
  }
  if (resultsField) {
    userEvent.type(
      resultsField,
      "Log in didn't work, and I expected it to work"
    );
  }

  userEvent.click(screen.getByRole("button", { name: "Submit" }));
}

describe("BugReport", () => {
  beforeEach(() => {
    reportBugMock.mockResolvedValue("1");
  });

  describe("when displayed on a screen at the medium breakpoint or above", () => {
    it("shows a button to open the bug report dialog initially", () => {
      render(<BugReport />, { wrapper });

      const reportBugButton = screen.getByRole("button", {
        name: "Report a bug",
      });
      expect(reportBugButton).toBeVisible();
      expect(reportBugButton).toHaveTextContent("Report a bug");
    });
  });

  describe("when displayed in a small screen", () => {
    function createMatchMedia(width: number) {
      return (query: string) => ({
        addListener: jest.fn(),
        matches: mediaQuery.match(query, { width }),
        removeListener: jest.fn(),
      });
    }

    beforeEach(() => {
      // @ts-ignore JSDom doesn't enforce this to be readonly, so less verbose to do this than
      // using Object.defineProperty(...)
      window.innerWidth = 959;
      // @ts-ignore
      window.matchMedia = createMatchMedia(window.innerWidth);
    });

    afterEach(() => {
      // @ts-ignore reset back to default JSDom window width
      window.innerWidth = 1024;
      // @ts-ignore unset to prevent this from interferring tests below
      window.matchMedia = undefined;
    });

    it("shows a button with only the bug report icon", () => {
      render(<BugReport />, { wrapper });
      const reportBugButton = screen.getByRole("button", {
        name: "Report a bug",
      });
      expect(reportBugButton).toBeVisible();
      expect(reportBugButton).not.toHaveTextContent("Report a bug");
    });
  });

  describe('when the "report a bug" button is clicked', () => {
    const subjectFieldLabel = "Brief description of the bug";
    const descriptionFieldLabel = "What's the problem?";
    const stepsFieldLabel = "What did you do to trigger the bug?";
    const resultsFieldLabel =
      "What happened? What did you expect should have happened?";

    it("shows the bug report dialog correctly when the button is clicked", async () => {
      const infoText =
        "Please note that this information, as well as diagnostic information including which page you are on, what browser you are using, and your user ID will be saved to a public list of bugs.";
      render(<BugReport />, { wrapper });

      userEvent.click(screen.getByRole("button", { name: "Report a bug" }));

      expect(
        await screen.findByRole("heading", { name: "Report a problem" })
      ).toBeVisible();
      expect(screen.getByText(infoText)).toBeVisible();
      expect(screen.getByLabelText(subjectFieldLabel)).toBeVisible();
      expect(screen.getByLabelText(descriptionFieldLabel)).toBeVisible();
      expect(screen.getByLabelText(stepsFieldLabel)).toBeVisible();
      expect(screen.getByLabelText(resultsFieldLabel)).toBeVisible();
    });

    it("does not submit the bug report if the required fields are not filled in", async () => {
      render(<BugReport />, { wrapper });

      userEvent.click(screen.getByRole("button", { name: "Report a bug" }));
      userEvent.click(await screen.findByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(reportBugMock).not.toHaveBeenCalled();
      });
    });

    it("submits the bug report successfully if all required fields are filled in", async () => {
      render(<BugReport />, { wrapper });
      userEvent.click(screen.getByRole("button", { name: "Report a bug" }));

      await fillInAndSubmitBugReport(subjectFieldLabel, descriptionFieldLabel);

      expect(await screen.findByRole("progressbar")).toBeVisible();
      const successMessage =
        "Thank you for reporting that bug and making Couchers better, a report was sent to the devs! The bug ID is 1";
      const successAlert = screen.getByRole("alert");
      expect(within(successAlert).getByText(successMessage)).toBeVisible();
      expect(reportBugMock).toHaveBeenCalledTimes(1);
      expect(reportBugMock).toHaveBeenCalledWith(
        {
          description: "Log in is broken",
          results: "",
          steps: "",
          subject: "Broken log in",
        },
        null
      );
    });

    it("submits the bug report successfully if everything has been filled in", async () => {
      render(<BugReport />, { wrapper });
      userEvent.click(screen.getByRole("button", { name: "Report a bug" }));

      await fillInAndSubmitBugReport(
        subjectFieldLabel,
        descriptionFieldLabel,
        stepsFieldLabel,
        resultsFieldLabel
      );

      await waitFor(() => {
        expect(reportBugMock).toHaveBeenCalledTimes(1);
      });
      expect(reportBugMock).toHaveBeenCalledWith(
        {
          description: "Log in is broken",
          results: "Log in didn't work, and I expected it to work",
          steps: "Type in user name and clicked log in",
          subject: "Broken log in",
        },
        null
      );
    });

    it("submits the bug report with a user ID if there is an authenticated user", async () => {
      addDefaultUser();
      render(<BugReport />, { wrapper });
      userEvent.click(screen.getByRole("button", { name: "Report a bug" }));
      await fillInAndSubmitBugReport(subjectFieldLabel, descriptionFieldLabel);

      await waitFor(() => {
        expect(reportBugMock).toHaveBeenCalledTimes(1);
      });
      expect(reportBugMock).toHaveBeenCalledWith(
        {
          description: "Log in is broken",
          results: "",
          steps: "",
          subject: "Broken log in",
        },
        1
      );
    });

    it("shows an error alert if the bug report failed to submit", async () => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
      reportBugMock.mockRejectedValue(new Error("Bug tool disabled"));
      render(<BugReport />, { wrapper });
      userEvent.click(screen.getByRole("button", { name: "Report a bug" }));

      await fillInAndSubmitBugReport(subjectFieldLabel, descriptionFieldLabel);

      const errorAlert = await screen.findByRole("alert");
      expect(within(errorAlert).getByText("Bug tool disabled")).toBeVisible();
    });

    it("resets error in the bug report dialog when it is being reopened", async () => {
      reportBugMock.mockRejectedValue(new Error("Bug tool disabled"));
      render(<BugReport />, { wrapper });
      userEvent.click(screen.getByRole("button", { name: "Report a bug" }));
      await fillInAndSubmitBugReport(subjectFieldLabel, descriptionFieldLabel);
      await screen.findByRole("alert");

      // Close dialog by clicking on background
      userEvent.click(document.querySelector(".MuiBackdrop-root")!);
      // Wait for the dialog to close properly first before trying to reopen
      await waitForElementToBeRemoved(screen.getByRole("presentation"));
      userEvent.click(screen.getByRole("button", { name: "Report a bug" }));

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });
  });
});
