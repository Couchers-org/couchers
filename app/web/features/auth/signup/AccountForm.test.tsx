import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditLocationMapProps } from "components/EditLocationMap";
import { hostingStatusLabels } from "features/profile/constants";
import { StatusCode } from "grpc-web";
import { HostingStatus } from "proto/api_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import {
  assertErrorAlert,
  mockConsoleError,
  MockedService,
  t,
} from "test/utils";

import AccountForm from "./AccountForm";

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
        })
      );
      render(<AccountForm />, { wrapper });

      userEvent.type(
        await screen.findByLabelText(
          t("auth:account_form.username.field_label")
        ),
        "test"
      );
      userEvent.type(
        await screen.findByLabelText(
          t("auth:account_form.password.field_label")
        ),
        "a very insecure password"
      );
      const birthdayField = screen.getByLabelText(
        t("auth:account_form.birthday.field_label")
      );
      userEvent.clear(birthdayField);
      userEvent.type(birthdayField, "01/01/1990");

      userEvent.type(
        screen.getByTestId("edit-location-map"),
        "test city, test country"
      );

      const hostingStatusItem = await screen.findByText(
        hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_CAN_HOST]
      );
      userEvent.selectOptions(
        screen.getByLabelText(
          t("auth:account_form.hosting_status.field_label")
        ),
        hostingStatusItem
      );

      userEvent.click(
        screen.getByLabelText(t("auth:account_form.gender.woman"))
      );
      userEvent.click(
        screen.getByLabelText(t("auth:account_form.tos_accept_label"))
      );
    });

    it("submits correctly", async () => {
      userEvent.click(
        screen.getByRole("button", { name: t("global:sign_up") })
      );

      await waitFor(() => {
        expect(signupFlowAccountMock).toHaveBeenCalledWith({
          flowToken: "token",
          username: "test",
          password: "a very insecure password",
          birthdate: "1990-01-01",
          gender: "Woman",
          acceptTOS: true,
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
        t("auth:account_form.username.field_label")
      );
      userEvent.clear(usernameField);
      userEvent.type(usernameField, "TeSt");
      userEvent.click(
        screen.getByRole("button", { name: t("global:sign_up") })
      );

      await waitFor(() => {
        expect(signupFlowAccountMock).toHaveBeenCalledWith({
          flowToken: "token",
          username: "test",
          password: "a very insecure password",
          birthdate: "1990-01-01",
          gender: "Woman",
          acceptTOS: true,
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
        t("auth:account_form.username.field_label")
      );
      userEvent.clear(field);
      userEvent.click(
        screen.getByRole("button", { name: t("global:sign_up") })
      );

      expect(
        await screen.findByText(t("auth:account_form.username.required_error"))
      ).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();

      userEvent.type(field, "1user");
      userEvent.click(
        screen.getByRole("button", { name: t("global:sign_up") })
      );

      expect(
        await screen.findByText(
          t("auth:account_form.username.validation_error")
        )
      ).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("fails on incorrect birthdate", async () => {
      const field = screen.getByLabelText(
        t("auth:account_form.birthday.field_label")
      );
      userEvent.clear(field);
      userEvent.type(field, "01/01/2099");
      userEvent.click(
        screen.getByRole("button", { name: t("global:sign_up") })
      );

      expect(
        await screen.findByText(
          t("auth:account_form.birthday.validation_error")
        )
      ).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("fails on blank location", async () => {
      const field = screen.getByTestId("edit-location-map");
      userEvent.clear(field);
      userEvent.click(
        screen.getByRole("button", { name: t("global:sign_up") })
      );

      expect(
        await screen.findByText(t("auth:location.validation_error"))
      ).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("fails if hosting status is blank", async () => {
      const field = screen.getByLabelText(
        t("auth:account_form.hosting_status.field_label")
      );
      userEvent.selectOptions(field, "");
      userEvent.click(
        screen.getByRole("button", { name: t("global:sign_up") })
      );

      expect(await screen.findByText("Required")).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("fails on blank gender status", async () => {
      const field = screen.getByLabelText(t("auth:account_form.gender.woman"));
      userEvent.clear(field);
      userEvent.click(
        screen.getByRole("button", { name: t("global:sign_up") })
      );

      expect(
        await screen.findByText(t("auth:account_form.gender.required_error"))
      ).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("fails if TOS not agreed", async () => {
      const checkbox = screen.getByLabelText(
        t("auth:account_form.tos_accept_label")
      );
      userEvent.click(checkbox);
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
      userEvent.click(
        screen.getByRole("button", { name: t("global:sign_up") })
      );
      await assertErrorAlert("Generic error");
    });
  });
});
