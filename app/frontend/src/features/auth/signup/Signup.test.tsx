import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QUESTIONS_OPTIONAL } from "components/ContributorForm/constants";
import { EditLocationMapProps } from "components/EditLocationMap";
import {
  EMAIL_LABEL,
  FEMALE,
  HOSTING_STATUS,
  NAME_LABEL,
  SIGN_UP,
  SIGN_UP_AWAITING_EMAIL,
  SIGN_UP_BIRTHDAY,
  SIGN_UP_REDIRECT,
  SIGN_UP_TOS_ACCEPT,
  USERNAME,
} from "features/auth/constants";
import { SUBMIT } from "features/constants";
import { hostingStatusLabels } from "features/profile/constants";
import { StatusCode } from "grpc-web";
import { HostingStatus } from "proto/api_pb";
import { SignupFlowRes } from "proto/auth_pb";
import { Route, Switch } from "react-router-dom";
import { signupRoute } from "routes";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

import Signup from "./Signup";

const startSignupMock = service.auth.startSignup as MockedService<
  typeof service.auth.startSignup
>;
const signupFlowAccountMock = service.auth.signupFlowAccount as MockedService<
  typeof service.auth.signupFlowAccount
>;
const signupFlowFeedbackMock = service.auth.signupFlowFeedback as MockedService<
  typeof service.auth.signupFlowFeedback
>;
const validateUsernameMock = service.auth.validateUsername as MockedService<
  typeof service.auth.validateUsername
>;

const View = () => {
  return (
    <Switch>
      <Route path={signupRoute}>
        <Signup />
      </Route>
      <Route>
        <p data-testid="dashboard">Dashboard</p>
      </Route>
    </Switch>
  );
};

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

describe("Signup", () => {
  it("has the correct flow basic -> account -> contributor form -> success", async () => {
    jest.setTimeout(10000);
    startSignupMock.mockResolvedValue({
      flowToken: "token",
      needBasic: false,
      needAccount: true,
      needFeedback: true,
      needVerifyEmail: false,
    });
    signupFlowAccountMock.mockResolvedValue({
      flowToken: "token",
      needBasic: false,
      needAccount: false,
      needFeedback: true,
      needVerifyEmail: false,
    });
    validateUsernameMock.mockResolvedValue(true);
    signupFlowFeedbackMock.mockResolvedValue({
      flowToken: "token",
      authRes: { userId: 1, jailed: false },
      needBasic: false,
      needAccount: false,
      needFeedback: false,
      needVerifyEmail: false,
    });

    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });

    userEvent.type(screen.getByLabelText(NAME_LABEL), "Test user");
    userEvent.type(
      screen.getByLabelText(EMAIL_LABEL),
      "test@example.com{enter}"
    );
    await waitFor(() => {
      expect(screen.getByRole("progressbar")).toBeVisible();
    });

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

    userEvent.click(screen.getByRole("button", { name: SIGN_UP }));

    await waitFor(() => {
      expect(screen.getByText(QUESTIONS_OPTIONAL)).toBeVisible();
    });

    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    expect(await screen.findByTestId("dashboard")).toBeVisible();
  });

  it.each`
    hasAuthRes | needBasic | needAccount | needFeedback | needVerifyEmail | expectedForm
    ${false}   | ${true}   | ${true}     | ${true}      | ${true}         | ${"basic"}
    ${false}   | ${false}  | ${true}     | ${true}      | ${true}         | ${"account"}
    ${false}   | ${false}  | ${true}     | ${false}     | ${true}         | ${"account"}
    ${false}   | ${false}  | ${true}     | ${false}     | ${false}        | ${"account"}
    ${false}   | ${false}  | ${false}    | ${true}      | ${true}         | ${"feedback"}
    ${false}   | ${false}  | ${false}    | ${true}      | ${false}        | ${"feedback"}
    ${false}   | ${false}  | ${false}    | ${false}     | ${true}         | ${"email"}
    ${false}   | ${false}  | ${false}    | ${false}     | ${false}        | ${"error"}
    ${true}    | ${false}  | ${false}    | ${false}     | ${false}        | ${"dashboard"}
  `(
    "displays $expectedForm form given state: $hasAuthRes $needBasic $needAccount $needFeedback $needVerifyEmail",
    async (data) => {
      const state: SignupFlowRes.AsObject = {
        ...data,
        hasAuthRes: undefined,
        expectedForm: undefined,
        flowToken: "token",
        authRes: data.hasAuthRes ? { userId: 1, jailed: false } : undefined,
      };
      window.localStorage.setItem("auth.flowState", JSON.stringify(state));

      if (data.expectedForm === "error") {
        mockConsoleError();
        expect(() =>
          render(<View />, {
            wrapper: getHookWrapperWithClient({
              initialRouterEntries: [signupRoute],
            }).wrapper,
          })
        ).toThrow();
        return;
      }

      render(<View />, {
        wrapper: getHookWrapperWithClient({
          initialRouterEntries: [signupRoute],
        }).wrapper,
      });

      switch (data.expectedForm) {
        case "basic":
          expect(screen.getByLabelText(EMAIL_LABEL)).toBeVisible();
          break;
        case "account":
          expect(screen.getByLabelText(USERNAME)).toBeVisible();
          break;
        case "feedback":
          expect(screen.getByText(QUESTIONS_OPTIONAL)).toBeVisible();
          break;
        case "email":
          expect(screen.getByText(SIGN_UP_AWAITING_EMAIL)).toBeVisible();
          break;
        case "redirect":
          expect(await screen.findByText(SIGN_UP_REDIRECT)).toBeVisible();
          break;
      }
    }
  );
});
