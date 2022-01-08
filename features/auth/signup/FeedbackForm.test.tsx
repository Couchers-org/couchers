import { render, screen, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import { EXPERTISE_LABEL, SUBMIT } from "components/ContributorForm/constants";
import { ContributeOption } from "proto/auth_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

import { useAuthContext } from "../AuthProvider";
import FeedbackForm from "./FeedbackForm";

const signupFlowFeedbackMock = service.auth.signupFlowFeedback as MockedService<
  typeof service.auth.signupFlowFeedback
>;

const stateBeforeFeedback = {
  flowToken: "dummy-token",
  success: false,
  needBasic: false,
  needAccount: false,
  needFeedback: true,
  needAcceptCommunityGuidelines: true,
  needVerifyEmail: true,
};

const stateAfterFeedback = {
  flowToken: "dummy-token",
  success: false,
  needBasic: false,
  needAccount: false,
  needFeedback: false,
  needAcceptCommunityGuidelines: true,
  needVerifyEmail: true,
};

describe("signup form (feedback part)", () => {
  it("works", async () => {
    signupFlowFeedbackMock.mockResolvedValue(stateAfterFeedback);
    window.localStorage.setItem(
      "auth.flowState",
      JSON.stringify(stateBeforeFeedback)
    );
    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
    });
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState).toStrictEqual(
      stateBeforeFeedback
    );

    render(<FeedbackForm />, { wrapper });
    userEvent.type(
      await screen.findByLabelText(EXPERTISE_LABEL),
      "I have lots of expertise!"
    );
    userEvent.click(await screen.findByRole("button", { name: SUBMIT }));

    await waitFor(() => {
      expect(signupFlowFeedbackMock).toBeCalledTimes(1);
      const params = signupFlowFeedbackMock.mock.calls[0];
      expect(params[0]).toBe("dummy-token");
      expect(params[1].contribute).toBe(
        ContributeOption.CONTRIBUTE_OPTION_UNSPECIFIED
      );
      expect(params[1].expertise).toBe("I have lots of expertise!");
    });

    const { result: result2 } = renderHook(() => useAuthContext(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result2.current.authState.authenticated).toBe(false);
      expect(result2.current.authState.flowState).toMatchObject(
        stateAfterFeedback
      );
    });
  });
});
