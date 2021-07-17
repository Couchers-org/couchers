import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COMMUNITY_GUIDELINE_LABEL } from "components/CommunityGuidelines.tsx/constants";
import CommunityGuidelinesForm from "features/auth/signup/CommunityGuidelinesForm";
import { StatusCode } from "grpc-web";
import React from "react";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

import { CONTINUE } from "../constants";

const signupFlowCommunityGuidelinesMock = service.auth
  .signupFlowCommunityGuidelines as MockedService<
  typeof service.auth.signupFlowCommunityGuidelines
>;

describe("community guidelines signup form", () => {
  it("works only with all boxes checked", async () => {
    signupFlowCommunityGuidelinesMock.mockResolvedValue({
      flowToken: "dummy-token",
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: true,
      needVerifyEmail: true,
    });
    render(<CommunityGuidelinesForm />, { wrapper });
    const checkboxes = screen.getAllByLabelText(COMMUNITY_GUIDELINE_LABEL);
    const button = await screen.findByRole("button", { name: CONTINUE });
    checkboxes.forEach((checkbox) => {
      expect(button).toBeDisabled();
      expect(signupFlowCommunityGuidelinesMock).not.toBeCalled();
      userEvent.click(checkbox);
    });
    await waitFor(() => expect(button).not.toBeDisabled());
    userEvent.click(button);

    await waitFor(() => {
      expect(signupFlowCommunityGuidelinesMock).toBeCalledWith(true);
    });
  });

  it("displays an error when present", async () => {
    signupFlowCommunityGuidelinesMock.mockRejectedValueOnce({
      code: StatusCode.PERMISSION_DENIED,
      message: "Permission denied",
    });
    render(<CommunityGuidelinesForm />, {
      wrapper,
    });

    const checkboxes = screen.getAllByLabelText(COMMUNITY_GUIDELINE_LABEL);
    const button = screen.getByRole("button", { name: CONTINUE });
    checkboxes.forEach((checkbox) => {
      userEvent.click(checkbox);
    });
    await waitFor(() => expect(button).not.toBeDisabled());
    userEvent.click(button);

    mockConsoleError();
    await assertErrorAlert("Permission denied");
  });
});
