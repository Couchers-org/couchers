import { useMediaQuery } from "@mui/material";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mediaQuery from "css-mediaquery";
import { helpCenterReportContentURL } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService, wait } from "test/utils";

import ReportButton from "./ReportButton";

const { t } = i18n;

jest.mock("@mui/material", () => ({
  ...jest.requireActual("@mui/material"),
  useMediaQuery: jest.fn(),
}));

const reportBugMock = service.bugs.reportBug as MockedService<
  typeof service.bugs.reportBug
>;

async function fillInAndSubmitReportButton(
  subjectFieldLabel: string,
  descriptionFieldLabel: string,
  resultsFieldLabel = "",
) {
  const subjectField = await screen.findByLabelText(subjectFieldLabel);
  const descriptionField = await screen.findByLabelText(descriptionFieldLabel);
  const resultsField = screen.queryByLabelText(resultsFieldLabel);
  const user = userEvent.setup();

  await user.type(subjectField, "Broken log in");
  await user.type(descriptionField, "Log in is broken");

  if (resultsField) {
    await user.type(
      resultsField,
      "Log in didn't work, and I expected it to work",
    );
  }

  await user.click(screen.getByRole("button", { name: t("global:submit") }));
}

describe("ReportButton", () => {
  beforeEach(() => {
    reportBugMock.mockResolvedValue({
      bugId: "#1",
      bugUrl: "https://github.com/Couchers-org/couchers/issues/1",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("when displayed on a screen at the medium breakpoint or above", () => {
    it("shows a button to open the bug report dialog initially", () => {
      render(<ReportButton />, { wrapper });

      const reportBugButton = screen.getByRole("button", {
        name: t("global:report.label"),
      });
      expect(reportBugButton).toBeVisible();
      expect(reportBugButton).toHaveTextContent(t("global:report.label"));
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
      // Mock useMediaQuery for this specific test to simulate small screen
      (useMediaQuery as jest.Mock).mockReturnValue(true);

      render(<ReportButton />, { wrapper });
      const reportBugButton = screen.getByRole("button", {
        name: t("global:report.label"),
      });
      expect(reportBugButton).toBeVisible();
      expect(reportBugButton).not.toHaveTextContent(t("global:report.label"));
    });

    it("shows a button with both the bug report icon and label text if 'isResponse' is set to false", () => {
      render(<ReportButton isResponsive={false} />, { wrapper });
      const reportBugButton = screen.getByRole("button", {
        name: t("global:report.label"),
      });
      expect(reportBugButton).toBeVisible();
      expect(reportBugButton).toHaveTextContent(t("global:report.label"));
    });
  });

  describe('when the "report a bug" button is clicked', () => {
    const subjectFieldLabel = t("global:report.bug.title_label");
    const descriptionFieldLabel = t("global:report.bug.problem_label");
    const resultsFieldLabel = t("global:report.bug.expect_label");

    it("shows the report dialog correctly when the button is clicked", async () => {
      render(<ReportButton />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: t("global:report.label") }),
      );
      expect(
        await screen.findByRole("button", {
          name: t("global:report.bug.button_label"),
        }),
      ).toBeVisible();
      expect(
        screen.getByRole("link", {
          name: t("global:report.content.button_label"),
        }),
      ).toBeVisible();
    });

    it("redirects to help center report URL", async () => {
      render(<ReportButton />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: t("global:report.label") }),
      );

      const reportContentLink = await screen.findByRole("link", {
        name: t("global:report.content.button_label"),
      });

      expect(reportContentLink).toBeVisible();
      expect(reportContentLink).toHaveAttribute(
        "href",
        helpCenterReportContentURL,
      );
    });

    it("shows the bug report form correctly when that option is clicked", async () => {
      const infoText = t("global:report.bug.warning_message");
      render(<ReportButton />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: t("global:report.label") }),
      );
      await user.click(
        screen.getByRole("button", {
          name: t("global:report.bug.button_label"),
        }),
      );

      expect(
        await screen.findByRole("heading", { name: "Report a problem" }),
      ).toBeVisible();
      expect(screen.getByText(infoText)).toBeVisible();
      expect(screen.getByLabelText(subjectFieldLabel)).toBeVisible();
      expect(screen.getByLabelText(descriptionFieldLabel)).toBeVisible();
      expect(screen.getByLabelText(resultsFieldLabel)).toBeVisible();
    });

    it("does not submit the bug report if the required fields are not filled in", async () => {
      render(<ReportButton />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: t("global:report.label") }),
      );
      await user.click(
        screen.getByRole("button", {
          name: t("global:report.bug.button_label"),
        }),
      );
      await user.click(
        await screen.findByRole("button", { name: t("global:submit") }),
      );

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

      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: t("global:report.label") }),
      );
      await user.click(
        screen.getByRole("button", {
          name: t("global:report.bug.button_label"),
        }),
      );

      await fillInAndSubmitReportButton(
        subjectFieldLabel,
        descriptionFieldLabel,
      );

      const successAlert = await screen.findByRole("alert");
      expect(
        within(successAlert).getByText(t("global:report.bug.success_message"), {
          exact: false,
        }),
      ).toBeVisible();
      expect(await within(successAlert).findByRole("link")).toHaveTextContent(
        "#1",
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

      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: t("global:report.label") }),
      );
      await user.click(
        screen.getByRole("button", {
          name: t("global:report.bug.button_label"),
        }),
      );

      await fillInAndSubmitReportButton(
        subjectFieldLabel,
        descriptionFieldLabel,
        resultsFieldLabel,
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

      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: t("global:report.label") }),
      );
      await user.click(
        screen.getByRole("button", {
          name: t("global:report.bug.button_label"),
        }),
      );

      await fillInAndSubmitReportButton(
        subjectFieldLabel,
        descriptionFieldLabel,
      );

      const errorAlert = await screen.findByRole("alert");
      expect(within(errorAlert).getByText("Bug tool disabled")).toBeVisible();
    });

    it("resets error in the bug report dialog when it is being reopened", async () => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
      reportBugMock.mockRejectedValue(new Error("Bug tool disabled"));
      render(<ReportButton />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: t("global:report.label") }),
      );
      await user.click(
        screen.getByRole("button", {
          name: t("global:report.bug.button_label"),
        }),
      );
      await fillInAndSubmitReportButton(
        subjectFieldLabel,
        descriptionFieldLabel,
      );
      await screen.findByRole("alert");

      // Close dialog by clicking on close button
      await user.click(
        screen.getByRole("button", { name: t("global:cancel") }),
      );
      // Wait for the dialog to close properly first before trying to reopen
      const [, secondElement] = screen.queryAllByRole("presentation");
      // Wait for the second dialog to be removed
      await waitForElementToBeRemoved(secondElement);
      await user.click(
        screen.getByRole("button", { name: t("global:report.label") }),
      );
      await user.click(
        screen.getByRole("button", {
          name: t("global:report.bug.button_label"),
        }),
      );

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });
  });
});
