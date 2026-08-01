import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditLocationMapProps } from "components/EditLocationMap";
import { HostingStatus } from "couchers/proto/api_pb";
import { hostingStatusLabels } from "features/profile/constants";
import { StatusCode } from "grpc-web";
import { service } from "service";
import { Temporal } from "temporal-polyfill";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

import AccountForm from "./AccountForm";

const { t } = i18n;

jest.mock("@mui/x-date-pickers", () => {
  return {
    ...jest.requireActual("@mui/x-date-pickers"),
    DatePicker: jest.requireActual("@mui/x-date-pickers").DesktopDatePicker,
  };
});

const signupFlowAccountMock = service.auth.signupFlowAccount as MockedService<
  typeof service.auth.signupFlowAccount
>;
const validateUsernameMock = service.auth.validateUsername as MockedService<
  typeof service.auth.validateUsername
>;

jest.mock("components/EditLocationMap", () => ({
  __esModule: true,
  default: (props: EditLocationMapProps) => (
    <input
      data-testid="edit-location-map"
      onChange={(event) => {
        props.updateLocation({
          lat: 1,
          lng: 2,
          address: event.target.value,
          radius: 5,
        });
      }}
    />
  ),
}));

// The birthdate field is picker-only (read-only, no text entry): set it by
// opening the calendar and navigating year -> month -> day. minDate/maxDate on
// the picker (18-120 years ago) make out-of-range dates unselectable, so the
// too-young / too-old paths can't be reached through the UI.
async function selectBirthdate(
  user: ReturnType<typeof userEvent.setup>,
  { year, month, day }: { year: string; month: string; day: string },
) {
  const field = await screen.findByRole("textbox", {
    name: t("global:components.datepicker.change_date"),
  });
  await user.click(field);
  const dialog = await screen.findByRole("dialog");
  // Use findByRole (async) so the year/month/day views have time to render
  // under load — getByRole would miss them right after the dialog opens.
  await user.click(await within(dialog).findByRole("radio", { name: year }));
  await user.click(await within(dialog).findByRole("radio", { name: month }));
  await user.click(await within(dialog).findByRole("gridcell", { name: day }));
}

describe("AccountForm", () => {
  beforeEach(() => {
    signupFlowAccountMock.mockResolvedValue({
      flowToken: "token",
      needBasic: false,
      needAccount: false,
      needFeedback: false,
      needAcceptCommunityGuidelines: true,
      needMotivations: false,
      needVerifyEmail: false,
    });
    validateUsernameMock.mockResolvedValue(true);
  });

  describe("from a filled form", () => {
    beforeEach(async () => {
      window.localStorage.setItem(
        "auth.flowState",
        JSON.stringify({
          flowToken: "token",
          needBasic: false,
          needAccount: true,
          needFeedback: false,
          needVerifyEmail: false,
          needMotivations: false,
          needAcceptCommunityGuidelines: true,
        }),
      );
      render(<AccountForm />, { wrapper });

      const user = userEvent.setup();

      await user.type(
        await screen.findByLabelText(
          t("auth:account_form.username.field_label"),
        ),
        "test",
      );
      await user.type(
        await screen.findByLabelText(
          t("auth:account_form.password.field_label"),
        ),
        "a very insecure password",
      );
      await selectBirthdate(user, { year: "1990", month: "January", day: "1" });

      await user.type(
        screen.getByTestId("edit-location-map"),
        "test city, test country",
      );

      const hostingStatusItem = await screen.findByText(
        hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_CAN_HOST],
      );
      await user.selectOptions(
        screen.getByLabelText(
          t("auth:account_form.hosting_status.field_label"),
        ),
        hostingStatusItem,
      );

      await user.click(
        screen.getByLabelText(t("auth:account_form.gender.woman")),
      );
      await user.click(
        screen.getByLabelText(t("auth:account_form.tos_accept_label")),
      );
    });

    afterEach(() => {
      window.localStorage.clear();
    });

    it("submits correctly", async () => {
      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );

      await waitFor(() => {
        expect(signupFlowAccountMock).toHaveBeenCalledWith({
          flowToken: "token",
          username: "test",
          password: "a very insecure password",
          birthdate: Temporal.PlainDate.from("1990-01-01"),
          gender: "Woman",
          acceptTOS: true,
          optOutOfNewsletter: false,
          hostingStatus: HostingStatus.HOSTING_STATUS_CAN_HOST,
          city: "test city, test country",
          lat: 1,
          lng: 2,
          radius: 5,
        });
      });
    });

    it("displays the birthdate in the localized LL format", async () => {
      // beforeEach selects 1 January 1990; the read-only field renders it as the
      // localized long date ("LL"), with no editable mask/placeholder.
      const field = await screen.findByRole("textbox", {
        name: t("global:components.datepicker.change_date"),
      });

      expect(field).toHaveValue("January 1, 1990");
    });

    it("lowercases the username before submitting", async () => {
      const usernameField = screen.getByLabelText(
        t("auth:account_form.username.field_label"),
      );

      const user = userEvent.setup();

      await user.clear(usernameField);
      await user.type(usernameField, "TeSt");
      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );

      await waitFor(() => {
        expect(signupFlowAccountMock).toHaveBeenCalledWith({
          flowToken: "token",
          username: "test",
          password: "a very insecure password",
          birthdate: Temporal.PlainDate.from("1990-01-01"),
          gender: "Woman",
          acceptTOS: true,
          optOutOfNewsletter: false,
          hostingStatus: HostingStatus.HOSTING_STATUS_CAN_HOST,
          city: "test city, test country",
          lat: 1,
          lng: 2,
          radius: 5,
        });
      });
    });

    it("fails on incorrect/blank username", async () => {
      const field = screen.getByLabelText(
        t("auth:account_form.username.field_label"),
      );

      const user = userEvent.setup();

      await user.clear(field);
      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );

      expect(
        await screen.findByText(t("auth:account_form.username.required_error")),
      ).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();

      await user.type(field, "1user");
      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );

      expect(
        await screen.findByText(
          t("auth:account_form.username.validation_error"),
        ),
      ).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("fails on blank location", async () => {
      const field = screen.getByTestId("edit-location-map");
      const user = userEvent.setup();

      await user.clear(field);
      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );

      expect(
        await screen.findByText(t("auth:location.validation_error")),
      ).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("fails if hosting status is blank", async () => {
      const field = screen.getByLabelText(
        t("auth:account_form.hosting_status.field_label"),
      );

      const user = userEvent.setup();

      await user.selectOptions(field, "");
      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );

      expect(await screen.findByText("Required")).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("fails if TOS not agreed", async () => {
      const checkbox = screen.getByLabelText(
        t("auth:account_form.tos_accept_label"),
      );
      const user = userEvent.setup();

      await user.click(checkbox);
      const button = screen.getByRole("button", { name: t("global:sign_up") });

      await waitFor(() => {
        expect(button).toBeDisabled();
        expect(signupFlowAccountMock).not.toHaveBeenCalled();
      });
    });

    it("displays an error from the api", async () => {
      mockConsoleError();
      signupFlowAccountMock.mockRejectedValue({
        code: StatusCode.FAILED_PRECONDITION,
        message: "Generic error",
      });
      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );
      await assertErrorAlert("Generic error");
    });

    it("renders the password visibility toggle button", async () => {
      const toggleButton = await screen.findByLabelText(
        t("auth:login_page.form.show_password"),
      );
      expect(toggleButton).toBeInTheDocument();
    });

    it("toggles password visibility when clicking the button", async () => {
      const user = userEvent.setup();
      const passwordField = screen.getByLabelText(
        t("auth:account_form.password.field_label"),
      );

      // Initially password should be hidden
      expect(passwordField).toHaveAttribute("type", "password");

      // Click to show password
      const showButton = screen.getByLabelText(
        t("auth:login_page.form.show_password"),
      );
      await user.click(showButton);

      // Password should now be visible
      await waitFor(() => {
        expect(passwordField).toHaveAttribute("type", "text");
      });

      // Click to hide password again
      const hideButton = screen.getByLabelText(
        t("auth:login_page.form.hide_password"),
      );
      await user.click(hideButton);

      // Password should be hidden again
      await waitFor(() => {
        expect(passwordField).toHaveAttribute("type", "password");
      });
    });

    it("changes aria-label when toggling password visibility", async () => {
      const user = userEvent.setup();

      const showButton = screen.getByLabelText(
        t("auth:login_page.form.show_password"),
      );
      expect(showButton).toHaveAttribute(
        "aria-label",
        t("auth:login_page.form.show_password"),
      );

      await user.click(showButton);

      await waitFor(() => {
        const hideButton = screen.getByLabelText(
          t("auth:login_page.form.hide_password"),
        );
        expect(hideButton).toHaveAttribute(
          "aria-label",
          t("auth:login_page.form.hide_password"),
        );
      });
    });

    it("allows typing visible text in the password field when toggled", async () => {
      const user = userEvent.setup();
      const passwordField = screen.getByLabelText(
        t("auth:account_form.password.field_label"),
      );

      await user.clear(passwordField);
      await user.type(passwordField, "secretpassword");
      expect(passwordField).toHaveValue("secretpassword");
      expect(passwordField).toHaveAttribute("type", "password");

      const showButton = screen.getByLabelText(
        t("auth:login_page.form.show_password"),
      );
      await user.click(showButton);

      // Verify text is still there and type is now text
      await waitFor(() => {
        expect(passwordField).toHaveValue("secretpassword");
        expect(passwordField).toHaveAttribute("type", "text");
      });
    });
  });

  // Separating as you can't unselect a radio group once clicked
  describe("test radio button", () => {
    it("fails on blank gender status", async () => {
      window.localStorage.setItem(
        "auth.flowState",
        JSON.stringify({
          flowToken: "token",
          needBasic: false,
          needAccount: true,
          needFeedback: false,
          needVerifyEmail: false,
          needMotivations: false,
          needAcceptCommunityGuidelines: true,
        }),
      );
      render(<AccountForm />, { wrapper });

      const user = userEvent.setup();

      await user.type(
        await screen.findByLabelText(
          t("auth:account_form.username.field_label"),
        ),
        "test",
      );
      await user.type(
        await screen.findByLabelText(
          t("auth:account_form.password.field_label"),
        ),
        "a very insecure password",
      );
      await selectBirthdate(user, { year: "1990", month: "January", day: "1" });

      await user.type(
        screen.getByTestId("edit-location-map"),
        "test city, test country",
      );

      const hostingStatusItem = await screen.findByText(
        hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_CAN_HOST],
      );
      await user.selectOptions(
        screen.getByLabelText(
          t("auth:account_form.hosting_status.field_label"),
        ),
        hostingStatusItem,
      );

      await user.click(
        screen.getByLabelText(t("auth:account_form.tos_accept_label")),
      );

      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );

      expect(
        await screen.findByText(t("auth:account_form.gender.required_error")),
      ).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });
  });

  // The birthdate field can't be cleared once set (it's picker-only), so the
  // blank-birthdate case uses its own setup that fills everything else.
  describe("blank birthdate", () => {
    it("fails when no birthdate is selected", async () => {
      window.localStorage.setItem(
        "auth.flowState",
        JSON.stringify({
          flowToken: "token",
          needBasic: false,
          needAccount: true,
          needFeedback: false,
          needVerifyEmail: false,
          needMotivations: false,
          needAcceptCommunityGuidelines: true,
        }),
      );
      render(<AccountForm />, { wrapper });

      const user = userEvent.setup();

      await user.type(
        await screen.findByLabelText(
          t("auth:account_form.username.field_label"),
        ),
        "test",
      );
      await user.type(
        await screen.findByLabelText(
          t("auth:account_form.password.field_label"),
        ),
        "a very insecure password",
      );

      await user.type(
        screen.getByTestId("edit-location-map"),
        "test city, test country",
      );

      const hostingStatusItem = await screen.findByText(
        hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_CAN_HOST],
      );
      await user.selectOptions(
        screen.getByLabelText(
          t("auth:account_form.hosting_status.field_label"),
        ),
        hostingStatusItem,
      );

      await user.click(
        screen.getByLabelText(t("auth:account_form.gender.woman")),
      );
      await user.click(
        screen.getByLabelText(t("auth:account_form.tos_accept_label")),
      );

      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );

      expect(
        await screen.findByText(t("auth:account_form.birthday.required_error")),
      ).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();

      window.localStorage.clear();
    });
  });
});
