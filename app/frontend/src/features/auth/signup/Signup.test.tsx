import { render, screen, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import { COMMUNITY_GUIDELINE_LABEL } from "components/CommunityGuidelines/constants";
import { QUESTIONS_OPTIONAL } from "components/ContributorForm/constants";
import { EditLocationMapProps } from "components/EditLocationMap";
import {
  CONTINUE,
  EMAIL_LABEL,
  HOSTING_STATUS,
  NAME_LABEL,
  SIGN_UP,
  SIGN_UP_AWAITING_EMAIL,
  SIGN_UP_BIRTHDAY,
  SIGN_UP_REDIRECT,
  SIGN_UP_TOS_ACCEPT,
  USERNAME,
  WOMAN,
} from "features/auth/constants";
import useAuthStore from "features/auth/useAuthStore";
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
const getCommunityGuidelinesMock = service.resources
  .getCommunityGuidelines as MockedService<
  typeof service.resources.getCommunityGuidelines
>;
const signupFlowCommunityGuidelinesMock = service.auth
  .signupFlowCommunityGuidelines as MockedService<
  typeof service.auth.signupFlowCommunityGuidelines
>;
const signupFlowFeedbackMock = service.auth.signupFlowFeedback as MockedService<
  typeof service.auth.signupFlowFeedback
>;
const signupFlowEmailTokenMock = service.auth
  .signupFlowEmailToken as MockedService<
  typeof service.auth.signupFlowEmailToken
>;
const validateUsernameMock = service.auth.validateUsername as MockedService<
  typeof service.auth.validateUsername
>;

const View = () => {
  return (
    <Switch>
      <Route path={`${signupRoute}/:urlToken?`}>
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
  beforeEach(() => {
    getCommunityGuidelinesMock.mockResolvedValue({
      communityGuidelinesList: [
        {
          title: "Guideline 1",
          guideline: "Follow guideline 1",
          iconSvg: "<svg></svg>",
        },
        {
          title: "Guideline 2",
          guideline: "Follow guideline 2",
          iconSvg: "<svg></svg>",
        },
      ],
    });
  });
  describe("flow steps", () => {
    it("basic -> account form works", async () => {
      window.localStorage.setItem(
        "auth.flowState",
        JSON.stringify({
          flowToken: "token",
          needBasic: true,
          needAccount: true,
          needAcceptCommunityGuidelines: true,
          needFeedback: true,
          needVerifyEmail: false,
        })
      );
      startSignupMock.mockResolvedValue({
        flowToken: "token",
        needBasic: false,
        needAccount: true,
        needAcceptCommunityGuidelines: true,
        needFeedback: true,
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
      expect(await screen.findByLabelText(USERNAME)).toBeVisible();
    });

    it("account -> guidelines form works", async () => {
      window.localStorage.setItem(
        "auth.flowState",
        JSON.stringify({
          flowToken: "token",
          needBasic: false,
          needAccount: true,
          needAcceptCommunityGuidelines: true,
          needFeedback: true,
          needVerifyEmail: false,
        })
      );
      signupFlowAccountMock.mockResolvedValue({
        flowToken: "token",
        needBasic: false,
        needAccount: false,
        needAcceptCommunityGuidelines: true,
        needFeedback: true,
        needVerifyEmail: false,
      });
      validateUsernameMock.mockResolvedValue(true);

      render(<View />, {
        wrapper: getHookWrapperWithClient({
          initialRouterEntries: [signupRoute],
        }).wrapper,
      });

      userEvent.type(await screen.findByLabelText(USERNAME), "test");
      const birthdayField = screen.getByLabelText(SIGN_UP_BIRTHDAY);
      userEvent.clear(birthdayField);
      userEvent.type(birthdayField, "01/01/1990");

      userEvent.type(
        screen.getByTestId("edit-location-map"),
        "test city, test country"
      );

      userEvent.selectOptions(
        screen.getByLabelText(HOSTING_STATUS),
        hostingStatusLabels[HostingStatus.HOSTING_STATUS_CAN_HOST]
      );

      userEvent.click(screen.getByLabelText(WOMAN));
      userEvent.click(screen.getByLabelText(SIGN_UP_TOS_ACCEPT));

      userEvent.click(screen.getByRole("button", { name: SIGN_UP }));

      expect(await screen.findByText("Guideline 1")).toBeVisible();
    });

    it("guidelines -> contributor form works", async () => {
      window.localStorage.setItem(
        "auth.flowState",
        JSON.stringify({
          flowToken: "token",
          needBasic: false,
          needAccount: false,
          needAcceptCommunityGuidelines: true,
          needFeedback: true,
          needVerifyEmail: false,
        })
      );
      signupFlowCommunityGuidelinesMock.mockResolvedValue({
        flowToken: "token",
        needBasic: false,
        needAccount: false,
        needAcceptCommunityGuidelines: false,
        needFeedback: true,
        needVerifyEmail: false,
      });
      render(<View />, {
        wrapper: getHookWrapperWithClient({
          initialRouterEntries: [signupRoute],
        }).wrapper,
      });

      const checkboxes = await screen.findAllByLabelText(
        COMMUNITY_GUIDELINE_LABEL
      );
      checkboxes.forEach((checkbox) => userEvent.click(checkbox));
      const button = screen.getByRole("button", { name: CONTINUE });

      await waitFor(() => expect(button).not.toBeDisabled());
      userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(QUESTIONS_OPTIONAL)).toBeVisible();
      });
    });
  });

  it("contributor form -> success", async () => {
    window.localStorage.setItem(
      "auth.flowState",
      JSON.stringify({
        flowToken: "token",
        needBasic: false,
        needAccount: false,
        needAcceptCommunityGuidelines: false,
        needFeedback: true,
        needVerifyEmail: false,
      })
    );
    signupFlowFeedbackMock.mockResolvedValue({
      flowToken: "token",
      authRes: { userId: 1, jailed: false },
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: false,
      needVerifyEmail: false,
    });

    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });

    userEvent.click(screen.getByRole("button", { name: SUBMIT }));
    expect(await screen.findByTestId("dashboard")).toBeVisible();
  });

  it("displays the basic form if it is needed", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: true,
      needAccount: true,
      needAcceptCommunityGuidelines: true,
      needFeedback: true,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });
    expect(screen.getByLabelText(EMAIL_LABEL)).toBeVisible();
  });

  it("displays the account form when account, feedback, guidelines and email are pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: true,
      needFeedback: true,
      needAcceptCommunityGuidelines: true,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });
    expect(screen.getByLabelText(USERNAME)).toBeVisible();
  });

  it("displays the account form when account, guidelines and email are pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: true,
      needAcceptCommunityGuidelines: true,
      needFeedback: false,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });
    expect(screen.getByLabelText(USERNAME)).toBeVisible();
  });

  it("displays the account form when only account is pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: true,
      needAcceptCommunityGuidelines: false,
      needFeedback: false,
      needVerifyEmail: false,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });
    expect(screen.getByLabelText(USERNAME)).toBeVisible();
  });

  it("displays the guidelines form when guidelines, feedback and email are pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: true,
      needFeedback: true,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });
    expect(await screen.findByText("Guideline 1")).toBeVisible();
  });

  it("displays the guidelines form when only it and feedback are pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: true,
      needFeedback: true,
      needVerifyEmail: false,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });
    expect(await screen.findByText("Guideline 1")).toBeVisible();
  });

  it("displays the feedback form when feedback and email are pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: true,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });
    expect(screen.getByText(QUESTIONS_OPTIONAL)).toBeVisible();
  });

  it("displays the feedback form when only feedback is pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: true,
      needVerifyEmail: false,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });
    expect(screen.getByText(QUESTIONS_OPTIONAL)).toBeVisible();
  });

  it("displays the verify email message when email is pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: false,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });
    expect(screen.getByText(SIGN_UP_AWAITING_EMAIL)).toBeVisible();
  });

  it("displays the redirect message when nothing is pending and has authRes", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: false,
      needVerifyEmail: false,
      flowToken: "token",
      authRes: { userId: 1, jailed: false },
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });
    expect(await screen.findByText(SIGN_UP_REDIRECT)).toBeVisible();
  });

  it("throws an error if nothing is pending but there is no authres", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: false,
      needVerifyEmail: false,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    mockConsoleError();
    expect(() =>
      render(<View />, {
        wrapper: getHookWrapperWithClient({
          initialRouterEntries: [signupRoute],
        }).wrapper,
      })
    ).toThrow();
  });

  it("displays an error when present", async () => {
    const signupFlowFeedbackMock = service.auth
      .signupFlowFeedback as MockedService<
      typeof service.auth.signupFlowFeedback
    >;
    signupFlowFeedbackMock.mockRejectedValue({
      code: StatusCode.PERMISSION_DENIED,
      message: "Permission denied",
    });
    window.localStorage.setItem(
      "auth.flowState",
      JSON.stringify({
        flowToken: "token",
        needBasic: false,
        needAccount: false,
        needAcceptCommunityGuidelines: false,
        needFeedback: true,
        needVerifyEmail: false,
      })
    );
    render(<View />, {
      wrapper: getHookWrapperWithClient({
        initialRouterEntries: [signupRoute],
      }).wrapper,
    });

    userEvent.click(await screen.findByRole("button", { name: SUBMIT }));
    mockConsoleError();
    await assertErrorAlert("Permission denied");
  });

  it("sets the email flow state correctly when given a url token", async () => {
    signupFlowEmailTokenMock.mockResolvedValue({
      needBasic: false,
      needAccount: true,
      needAcceptCommunityGuidelines: true,
      needFeedback: true,
      needVerifyEmail: false,
      flowToken: "token",
    });
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: true,
      needAcceptCommunityGuidelines: true,
      needFeedback: true,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    const wrapper = getHookWrapperWithClient({
      initialRouterEntries: [`${signupRoute}/fakeEmailToken`],
    }).wrapper;
    render(<View />, {
      wrapper,
    });
    expect(await screen.findByLabelText(USERNAME)).toBeVisible();
    expect(signupFlowEmailTokenMock).toBeCalledWith("fakeEmailToken");
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.flowState?.needVerifyEmail).toBe(false);
  });

  it("displays an error when email token api errors", async () => {
    signupFlowEmailTokenMock.mockRejectedValue({
      code: StatusCode.NOT_FOUND,
      message: "Invalid token",
    });
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: true,
      needAcceptCommunityGuidelines: true,
      needFeedback: true,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    const wrapper = getHookWrapperWithClient({
      initialRouterEntries: [`${signupRoute}/fakeEmailToken`],
    }).wrapper;
    render(<View />, {
      wrapper,
    });
    await assertErrorAlert("Invalid token");
  });
});
