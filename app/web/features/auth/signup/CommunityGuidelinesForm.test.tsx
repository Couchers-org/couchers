import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommunityGuidelinesForm from "features/auth/signup/CommunityGuidelinesForm";
import { StatusCode } from "grpc-web";
import { service } from "service";
import wrapper from "test/hookWrapper";
import {
  assertErrorAlert,
  mockConsoleError,
  MockedService,
  t,
} from "test/utils";

const signupFlowCommunityGuidelinesMock = service.auth
  .signupFlowCommunityGuidelines as MockedService<
  typeof service.auth.signupFlowCommunityGuidelines
>;
const getCommunityGuidelinesMock = service.resources
  .getCommunityGuidelines as MockedService<
  typeof service.resources.getCommunityGuidelines
>;

describe("community guidelines signup form", () => {
  beforeEach(() => {
    window.localStorage.setItem(
      "auth.flowState",
      JSON.stringify({
        flowToken: "dummy-token",
        needBasic: false,
        needAccount: true,
        needFeedback: false,
        needVerifyEmail: false,
        needAcceptCommunityGuidelines: true,
      })
    );
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

    const checkboxes = await screen.findAllByLabelText(
      t("auth:community_guidelines_form.guideline.checkbox_label")
    );
    const button = await screen.findByRole("button", {
      name: t("global:continue"),
    });
    await Promise.all(
      checkboxes.map(async (checkbox) => {
        expect(button).toBeDisabled();
        expect(signupFlowCommunityGuidelinesMock).not.toBeCalled();
        await userEvent.click(checkbox);
      })
    );
    await waitFor(() => expect(button).not.toBeDisabled());
    await userEvent.click(button);

    await waitFor(() => {
      expect(signupFlowCommunityGuidelinesMock).toBeCalledWith(
        "dummy-token",
        true
      );
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

    const checkboxes = await screen.findAllByLabelText(
      t("auth:community_guidelines_form.guideline.checkbox_label")
    );
    const button = screen.getByRole("button", { name: t("global:continue") });
    await Promise.all(
      checkboxes.map(async (checkbox) => {
        await userEvent.click(checkbox);
      })
    );
    await waitFor(() => expect(button).not.toBeDisabled());
    await userEvent.click(button);

    mockConsoleError();
    await assertErrorAlert("Permission denied");
  });
});
