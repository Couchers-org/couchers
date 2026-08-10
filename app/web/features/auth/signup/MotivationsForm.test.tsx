import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusCode } from "grpc-web";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

import MotivationsForm from "./MotivationsForm";

const { t } = i18n;

const signupFlowMotivationsMock = service.auth.signupFlowMotivations as MockedService<
  typeof service.auth.signupFlowMotivations
>;

describe("MotivationsForm", () => {
  beforeEach(() => {
    window.localStorage.setItem(
      "auth.flowState",
      JSON.stringify({
        flowToken: "dummy-token",
        needBasic: false,
        needAccount: false,
        needFeedback: false,
        needVerifyEmail: true,
        needMotivations: true,
        needAcceptCommunityGuidelines: false,
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("submits with selected motivations", async () => {
    signupFlowMotivationsMock.mockResolvedValue({
      flowToken: "dummy-token",
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needMotivations: false,
      needFeedback: false,
      needVerifyEmail: true,
    });
    render(<MotivationsForm />, { wrapper });

    const user = userEvent.setup();

    await user.click(await screen.findByText(t("auth:motivations_form.surfing")));
    await user.click(screen.getByText(t("auth:motivations_form.hosting")));

    await user.click(screen.getByRole("button", { name: t("global:continue") }));

    await waitFor(() => {
      expect(signupFlowMotivationsMock).toHaveBeenCalledWith("dummy-token", ["surfing", "hosting"]);
    });
  });

  it("submits with no motivations selected", async () => {
    signupFlowMotivationsMock.mockResolvedValue({
      flowToken: "dummy-token",
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needMotivations: false,
      needFeedback: false,
      needVerifyEmail: true,
    });
    render(<MotivationsForm />, { wrapper });

    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: t("global:continue") }));

    await waitFor(() => {
      expect(signupFlowMotivationsMock).toHaveBeenCalledWith("dummy-token", []);
    });
  });

  it("displays an error from the api", async () => {
    mockConsoleError();
    signupFlowMotivationsMock.mockRejectedValue({
      code: StatusCode.FAILED_PRECONDITION,
      message: "Generic error",
    });
    render(<MotivationsForm />, { wrapper });

    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: t("global:continue") }));

    await assertErrorAlert("Generic error");
  });

  it("renders all motivation options", async () => {
    render(<MotivationsForm />, { wrapper });

    expect(await screen.findByText(t("auth:motivations_form.surfing"))).toBeVisible();
    expect(screen.getByText(t("auth:motivations_form.hosting"))).toBeVisible();
    expect(screen.getByText(t("auth:motivations_form.events"))).toBeVisible();
    expect(screen.getByText(t("auth:motivations_form.community_organizing"))).toBeVisible();
    expect(screen.getByText(t("auth:motivations_form.something_else"))).toBeVisible();
  });
});
