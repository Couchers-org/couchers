import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditLocationMapProps } from "components/EditLocationMap";
import {
  BIRTHDATE_LABEL,
  BIRTHDAY_PAST_ERROR,
  GENDER_REQUIRED,
  REQUIRED,
  SIGN_UP,
  SIGN_UP_BIRTHDAY,
  SIGN_UP_LOCATION_MISSING,
  SIGN_UP_TOS_ACCEPT,
  SIGN_UP_USERNAME_ERROR,
  USERNAME,
  USERNAME_REQUIRED,
} from "features/auth/constants";
import { FEMALE, HOSTING_STATUS } from "features/constants";
import { hostingStatusLabels } from "features/profile/constants";
import { StatusCode } from "grpc-web";
import { HostingStatus } from "proto/api_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

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
        })
      );
      render(<AccountForm />, { wrapper });

      userEvent.type(await screen.findByLabelText(USERNAME), "test");
      const birthdayField = screen.getByLabelText(SIGN_UP_BIRTHDAY);
      userEvent.clear(birthdayField);
      userEvent.type(birthdayField, "01/01/1990");

      userEvent.type(
        screen.getByTestId("edit-location-map"),
        "test city, test country"
      );

      userEvent.click(screen.getByLabelText(HOSTING_STATUS));
      const hostingStatusItem = await screen.findByText(
        hostingStatusLabels[HostingStatus.HOSTING_STATUS_CAN_HOST]
      );
      userEvent.click(hostingStatusItem);

      userEvent.click(screen.getByLabelText(FEMALE));
      userEvent.click(screen.getByLabelText(SIGN_UP_TOS_ACCEPT));
    });

    it("submits correctly", async () => {
      userEvent.click(screen.getByRole("button", { name: SIGN_UP }));

      await waitFor(() => {
        expect(signupFlowAccountMock).toHaveBeenCalledWith({
          flowToken: "token",
          username: "test",
          birthdate: "1990-01-01",
          gender: "Female",
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
      const field = screen.getByLabelText(USERNAME);
      userEvent.clear(field);
      userEvent.click(screen.getByRole("button", { name: SIGN_UP }));

      expect(await screen.findByText(USERNAME_REQUIRED)).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();

      userEvent.type(field, "1user");
      userEvent.click(screen.getByRole("button", { name: SIGN_UP }));

      expect(await screen.findByText(SIGN_UP_USERNAME_ERROR)).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("fails on incorrect birthdate", async () => {
      const field = screen.getByLabelText(BIRTHDATE_LABEL);
      userEvent.clear(field);
      userEvent.type(field, "01/01/2099");
      userEvent.click(screen.getByRole("button", { name: SIGN_UP }));

      expect(await screen.findByText(BIRTHDAY_PAST_ERROR)).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("fails on blank location", async () => {
      const field = screen.getByTestId("edit-location-map");
      userEvent.clear(field);
      userEvent.click(screen.getByRole("button", { name: SIGN_UP }));

      expect(await screen.findByText(SIGN_UP_LOCATION_MISSING)).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("fails on blank gender status", async () => {
      const field = screen.getByLabelText(FEMALE);
      userEvent.clear(field);
      userEvent.click(screen.getByRole("button", { name: SIGN_UP }));

      expect(await screen.findByText(GENDER_REQUIRED)).toBeVisible();
      expect(signupFlowAccountMock).not.toHaveBeenCalled();
    });

    it("fails if TOS not agreed", async () => {
      const checkbox = screen.getByLabelText(SIGN_UP_TOS_ACCEPT);
      userEvent.click(checkbox);
      const button = screen.getByRole("button", { name: SIGN_UP });

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
      userEvent.click(screen.getByRole("button", { name: SIGN_UP }));
      await assertErrorAlert("Generic error");
    });
  });

  //this is separate because hosting status isn't clearable
  it("fails on blank hosting status", async () => {
    window.localStorage.setItem(
      "auth.flowState",
      JSON.stringify({
        flowToken: "token",
        needBasic: false,
        needAccount: true,
        needFeedback: false,
        needVerifyEmail: false,
      })
    );
    render(<AccountForm />, { wrapper });

    userEvent.type(await screen.findByLabelText(USERNAME), "test");
    const birthdayField = screen.getByLabelText(SIGN_UP_BIRTHDAY);
    userEvent.clear(birthdayField);
    userEvent.type(birthdayField, "01/01/1990");

    userEvent.type(
      screen.getByTestId("edit-location-map"),
      "test city, test country"
    );

    userEvent.click(screen.getByLabelText(FEMALE));
    userEvent.click(screen.getByLabelText(SIGN_UP_TOS_ACCEPT));

    userEvent.click(screen.getByRole("button", { name: SIGN_UP }));

    expect(await screen.findByText(REQUIRED)).toBeVisible();
    expect(signupFlowAccountMock).not.toHaveBeenCalled();
  });
});
