import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditLocationMapProps } from "components/EditLocationMap";
import dayjs from "dayjs";
import { hostingStatusLabels } from "features/profile/constants";
import { StatusCode } from "grpc-web";
import { HostingStatus } from "proto/api_pb";
import { service } from "service";
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

describe("AccountForm", () => {
  beforeEach(() => {
    signupFlowAccountMock.mockResolvedValue({
      flowToken: "token",
      needBasic: false,
      needAccount: false,
      needFeedback: true,
      needAcceptCommunityGuidelines: true,
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
      const birthdayField = await screen.findByLabelText(
        t("auth:account_form.birthday.field_label"),
      );
      await user.clear(birthdayField);
      await user.type(birthdayField, "01/01/1990");

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
          birthdate: "1990-01-01",
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
          birthdate: "1990-01-01",
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

    it("Fails on birthdate older than 120", async () => {
      const field = await screen.findByLabelText(
        t("auth:account_form.birthday.field_label"),
      );

      const user = userEvent.setup();

      await user.clear(field);
      await user.type(field, "01/01/1750");
      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );

      expect(
        await screen.findByText(
          t("auth:account_form.birthday.not_real_date_error"),
        ),
      ).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("Fails on birthdate younger than 18", async () => {
      const field = await screen.findByLabelText(
        t("auth:account_form.birthday.field_label"),
      );

      const user = userEvent.setup();

      const seventeenYearsAgoDate = dayjs()
        .subtract(17, "year")
        .format("MM/DD/YYYY");

      await user.clear(field);
      await user.type(field, seventeenYearsAgoDate);
      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );

      expect(
        await screen.findByText(
          t("auth:account_form.birthday.too_young_error"),
        ),
      ).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("Fails on blank birthdate", async () => {
      const field = await screen.findByLabelText(
        t("auth:account_form.birthday.field_label"),
      );

      const user = userEvent.setup();

      await user.clear(field);

      expect(field).toHaveValue("");

      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );

      expect(
        await screen.findByText(t("auth:account_form.birthday.required_error")),
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
      const birthdayField = screen.getByLabelText(
        t("auth:account_form.birthday.field_label"),
      );
      await user.clear(birthdayField);
      await user.type(birthdayField, "01/01/1990");

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
});
