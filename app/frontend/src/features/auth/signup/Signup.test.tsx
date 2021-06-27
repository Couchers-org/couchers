import {
  findByLabelText,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DISPLAY_LOCATION, SEARCH_FOR_LOCATION } from "components/constants";
import {
  EMAIL_LABEL,
  FEMALE,
  HOSTING_STATUS,
  LOCATION_LABEL,
  NAME_LABEL,
  SIGN_UP,
  SIGN_UP_BIRTHDAY,
  SIGN_UP_TOS_ACCEPT,
  USERNAME,
} from "features/auth/constants";
import { hostingStatusLabels } from "features/profile/constants";
import { HostingStatus } from "proto/api_pb";
import { LoginRes } from "proto/auth_pb";
import { Route, Switch } from "react-router-dom";
import { signupRoute } from "routes";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { server } from "test/restMock";
import { MockedService } from "test/utils";

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

describe("Signup", () => {
  it("has the correct flow basic -> account -> contributor form -> success", async () => {
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
    server.listen();

    render(
      <Switch>
        <Route path={signupRoute}>
          <Signup />
        </Route>
        <Route path="/" exact>
          Dashboard
        </Route>
      </Switch>,
      {
        wrapper: getHookWrapperWithClient({
          initialRouterEntries: [signupRoute],
        }).wrapper,
      }
    );

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

    userEvent.type(screen.getByLabelText(SEARCH_FOR_LOCATION), "tes{enter}");
    const locationItem = await screen.findByText("test city, test country");
    userEvent.click(locationItem);

    userEvent.click(screen.getByLabelText(HOSTING_STATUS));
    const hostingStatusItem = await screen.findByText(
      hostingStatusLabels[HostingStatus.HOSTING_STATUS_CAN_HOST]
    );
    userEvent.click(hostingStatusItem);

    userEvent.click(screen.getByLabelText(FEMALE));
    userEvent.click(screen.getByLabelText(SIGN_UP_TOS_ACCEPT));

    userEvent.click(screen.getByRole("button", { name: SIGN_UP }));

    server.close();
  });
});
