import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommunityGuidelinesForm from "features/auth/signup/CommunityGuidelinesForm";
import { StatusCode } from "grpc-web";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService } from "test/utils";

const { t } = i18n;

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
      }),
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
      t("auth:community_guidelines_form.guideline.checkbox_label"),
    );
    const button = await screen.findByRole("button", {
      name: t("global:continue"),
    });
    const user = userEvent.setup();

    checkboxes.forEach(async (checkbox) => {
      expect(button).toBeDisabled();
      expect(signupFlowCommunityGuidelinesMock).not.toBeCalled();
      await user.click(checkbox);
    });
    await waitFor(() => expect(button).not.toBeDisabled());
    await user.click(button);

    await waitFor(() => {
      expect(signupFlowCommunityGuidelinesMock).toBeCalledWith(
        "dummy-token",
        true,
      );
    });
  });

  it("does not allow submit when checkbox left blank", async () => {
    signupFlowCommunityGuidelinesMock.mockRejectedValueOnce({
      code: StatusCode.PERMISSION_DENIED,
      message: "Permission denied",
    });
    render(<CommunityGuidelinesForm />, {
      wrapper,
    });

    const checkboxes = await screen.findAllByLabelText(
      t("auth:community_guidelines_form.guideline.checkbox_label"),
    );
    const user = userEvent.setup();

    const button = screen.getByRole("button", { name: t("global:continue") });
    checkboxes.forEach(async (checkbox) => {
      await user.click(checkbox);
    });
    await waitFor(() => expect(button).not.toBeDisabled());

    expect(
      screen.queryByText("All checkboxes are required"),
    ).not.toBeInTheDocument();

    const lastCheckbox = checkboxes[checkboxes.length - 1];

    await user.click(lastCheckbox);

    await waitFor(() => expect(button).toBeDisabled());

    expect(screen.getByText("All checkboxes are required")).toBeVisible();
  });
});
