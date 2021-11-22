import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mediaQuery from "css-mediaquery";
import {
  BUG_DESCRIPTION_NAME,
  BUG_REPORT_SUCCESS,
  CANCEL,
  EXPECT_NAME,
  PROBLEM_NAME,
  REPORT,
  REPORT_BUG_BUTTON,
  REPORT_CONTENT_BUTTON,
  REPORT_CONTENT_EMAIL,
  SUBMIT,
  WARNING,
} from "features/constants";
import { service } from "service";

import wrapper from "../test/hookWrapper";
import { MockedService, wait } from "../test/utils";
import ReportButton from "./ReportButton";

const reportBugMock = service.bugs.reportBug as MockedService<
  typeof service.bugs.reportBug
>;

afterEach(() => jest.restoreAllMocks);

async function fillInAndSubmitReportButton(
  subjectFieldLabel: string,
  descriptionFieldLabel: string,
  resultsFieldLabel: string = ""
) {
  const subjectField = await screen.findByLabelText(subjectFieldLabel);
  const descriptionField = await screen.findByLabelText(descriptionFieldLabel);
  const resultsField = screen.queryByLabelText(resultsFieldLabel);

  userEvent.type(subjectField, "Broken log in");
  userEvent.type(descriptionField, "Log in is broken");

  if (resultsField) {
    userEvent.type(
      resultsField,
      "Log in didn't work, and I expected it to work"
    );
  }

  userEvent.click(screen.getByRole("button", { name: SUBMIT }));
}

describe("ReportButton", () => {
  beforeEach(() => {
    reportBugMock.mockResolvedValue({
      bugId: "#1",
      bugUrl: "https://github.com/Couchers-org/couchers/issues/1",
    });
  });

  describe("when displayed on a screen at the medium breakpoint or above", () => {
    it("shows a button to open the bug report dialog initially", async () => {
      render(<ReportButton />, { wrapper });

      const reportBugButton = await screen.findByRole("button", {
        name: REPORT,
      });
      expect(reportBugButton).toBeVisible();
      expect(reportBugButton).toHaveTextContent(REPORT);
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

    it("shows a button with only the bug report icon", async () => {
      render(<ReportButton />, { wrapper });
      const reportBugButton = await screen.findByRole("button", {
        name: REPORT,
      });
      expect(reportBugButton).toBeVisible();
      expect(reportBugButton).not.toHaveTextContent(REPORT);
    });

    it("shows a button with both the bug report icon and label text if 'isResponse' is set to false", async () => {
      render(<ReportButton isResponsive={false} />, { wrapper });
      const reportBugButton = await screen.findByRole("button", {
        name: REPORT,
      });
      expect(reportBugButton).toBeVisible();
      expect(reportBugButton).toHaveTextContent(REPORT);
    });
  });

  describe('when the "report a bug" button is clicked', () => {
    const subjectFieldLabel = BUG_DESCRIPTION_NAME;
    const descriptionFieldLabel = PROBLEM_NAME;
    const resultsFieldLabel = EXPECT_NAME;

    it("shows the report dialog correctly when the button is clicked", async () => {
      render(<ReportButton />, { wrapper });

      userEvent.click(await screen.findByRole("button", { name: REPORT }));
      expect(
        await screen.findByRole("button", { name: REPORT_BUG_BUTTON })
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: REPORT_CONTENT_BUTTON })
      ).toBeVisible();
    });

    it("shows the content report email correctly when that option is clicked", async () => {
      render(<ReportButton />, { wrapper });

      userEvent.click(await screen.findByRole("button", { name: REPORT }));
      userEvent.click(
        screen.getByRole("button", { name: REPORT_CONTENT_BUTTON })
      );

      expect(
        await screen.findByRole("link", { name: REPORT_CONTENT_EMAIL })
      ).toBeVisible();
    });

    it("shows the bug report form correctly when that option is clicked", async () => {
      const infoText = WARNING;
      render(<ReportButton />, { wrapper });

      userEvent.click(await screen.findByRole("button", { name: REPORT }));
      userEvent.click(screen.getByRole("button", { name: REPORT_BUG_BUTTON }));

      expect(
        await screen.findByRole("heading", { name: "Report a problem" })
      ).toBeVisible();
      expect(screen.getByText(infoText)).toBeVisible();
      expect(screen.getByLabelText(subjectFieldLabel)).toBeVisible();
      expect(screen.getByLabelText(descriptionFieldLabel)).toBeVisible();
      expect(screen.getByLabelText(resultsFieldLabel)).toBeVisible();
    });

    it("does not submit the bug report if the required fields are not filled in", async () => {
      render(<ReportButton />, { wrapper });

      userEvent.click(await screen.findByRole("button", { name: REPORT }));
      userEvent.click(screen.getByRole("button", { name: REPORT_BUG_BUTTON }));
      userEvent.click(await screen.findByRole("button", { name: SUBMIT }));

      await waitFor(() => {
        expect(reportBugMock).not.toHaveBeenCalled();
      });
    });

    it("submits the bug report successfully if all required fields are filled in", async () => {
      reportBugMock.mockImplementation(async () => {
        await wait(10);
        return {
          bugId: "#1",
          bugUrl: "https://github.com/Couchers-org/couchers/issues/1",
        };
      });
      render(<ReportButton />, { wrapper });
      userEvent.click(await screen.findByRole("button", { name: REPORT }));
      userEvent.click(screen.getByRole("button", { name: REPORT_BUG_BUTTON }));

      await fillInAndSubmitReportButton(
        subjectFieldLabel,
        descriptionFieldLabel
      );

      expect(await screen.findByRole("progressbar")).toBeVisible();
      const successAlert = await screen.findByRole("alert");
      expect(
        within(successAlert).getByText(BUG_REPORT_SUCCESS, { exact: false })
      ).toBeVisible();
      expect(await within(successAlert).findByRole("link")).toHaveTextContent(
        "#1"
      );
      expect(reportBugMock).toHaveBeenCalledTimes(1);
      expect(reportBugMock).toHaveBeenCalledWith({
        description: "Log in is broken",
        results: "",
        subject: "Broken log in",
      });
    });

    it("submits the bug report successfully if everything has been filled in", async () => {
      render(<ReportButton />, { wrapper });
      userEvent.click(await screen.findByRole("button", { name: REPORT }));
      userEvent.click(screen.getByRole("button", { name: REPORT_BUG_BUTTON }));

      await fillInAndSubmitReportButton(
        subjectFieldLabel,
        descriptionFieldLabel,
        resultsFieldLabel
      );

      await waitFor(() => {
        expect(reportBugMock).toHaveBeenCalledTimes(1);
      });
      expect(reportBugMock).toHaveBeenCalledWith({
        description: "Log in is broken",
        results: "Log in didn't work, and I expected it to work",
        subject: "Broken log in",
      });
    });

    it("shows an error alert if the bug report failed to submit", async () => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
      reportBugMock.mockRejectedValue(new Error("Bug tool disabled"));
      render(<ReportButton />, { wrapper });
      userEvent.click(await screen.findByRole("button", { name: REPORT }));
      userEvent.click(screen.getByRole("button", { name: REPORT_BUG_BUTTON }));

      await fillInAndSubmitReportButton(
        subjectFieldLabel,
        descriptionFieldLabel
      );

      const errorAlert = await screen.findByRole("alert");
      expect(within(errorAlert).getByText("Bug tool disabled")).toBeVisible();
    });

    it("resets error in the bug report dialog when it is being reopened", async () => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
      reportBugMock.mockRejectedValue(new Error("Bug tool disabled"));
      render(<ReportButton />, { wrapper });
      userEvent.click(await screen.findByRole("button", { name: REPORT }));
      userEvent.click(screen.getByRole("button", { name: REPORT_BUG_BUTTON }));
      await fillInAndSubmitReportButton(
        subjectFieldLabel,
        descriptionFieldLabel
      );
      await screen.findByRole("alert");

      // Close dialog by clicking on close button
      userEvent.click(screen.getByRole("button", { name: CANCEL }));
      // Wait for the dialog to close properly first before trying to reopen
      await waitForElementToBeRemoved(screen.getByRole("presentation"));
      userEvent.click(await screen.findByRole("button", { name: REPORT }));
      userEvent.click(screen.getByRole("button", { name: REPORT_BUG_BUTTON }));

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });
  });
});
