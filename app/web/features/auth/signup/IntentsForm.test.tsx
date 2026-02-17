import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusCode } from "grpc-web";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

import IntentsForm from "./IntentsForm";

const { t } = i18n;

const signupFlowIntentsMock = service.auth.signupFlowIntents as MockedService<
  typeof service.auth.signupFlowIntents
>;

describe("IntentsForm", () => {
  beforeEach(() => {
    window.localStorage.setItem(
      "auth.flowState",
      JSON.stringify({
        flowToken: "dummy-token",
        needBasic: false,
        needAccount: false,
        needFeedback: false,
        needVerifyEmail: true,
        needIntents: true,
        needAcceptCommunityGuidelines: false,
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("submits with selected intents", async () => {
    signupFlowIntentsMock.mockResolvedValue({
      flowToken: "dummy-token",
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needIntents: false,
      needFeedback: false,
      needVerifyEmail: true,
    });
    render(<IntentsForm />, { wrapper });

    const user = userEvent.setup();

    await user.click(await screen.findByText(t("auth:intents_form.surfing")));
    await user.click(screen.getByText(t("auth:intents_form.hosting")));

    await user.click(
      screen.getByRole("button", { name: t("global:continue") }),
    );

    await waitFor(() => {
      expect(signupFlowIntentsMock).toHaveBeenCalledWith("dummy-token", [
        "surfing",
        "hosting",
      ]);
    });
  });

  it("submits with no intents selected", async () => {
    signupFlowIntentsMock.mockResolvedValue({
      flowToken: "dummy-token",
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needIntents: false,
      needFeedback: false,
      needVerifyEmail: true,
    });
    render(<IntentsForm />, { wrapper });

    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: t("global:continue") }),
    );

    await waitFor(() => {
      expect(signupFlowIntentsMock).toHaveBeenCalledWith("dummy-token", []);
    });
  });

  it("displays an error from the api", async () => {
    mockConsoleError();
    signupFlowIntentsMock.mockRejectedValue({
      code: StatusCode.FAILED_PRECONDITION,
      message: "Generic error",
    });
    render(<IntentsForm />, { wrapper });

    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: t("global:continue") }),
    );

    await assertErrorAlert("Generic error");
  });

  it("renders all intent options", async () => {
    render(<IntentsForm />, { wrapper });

    expect(
      await screen.findByText(t("auth:intents_form.surfing")),
    ).toBeVisible();
    expect(screen.getByText(t("auth:intents_form.hosting"))).toBeVisible();
    expect(screen.getByText(t("auth:intents_form.events"))).toBeVisible();
    expect(
      screen.getByText(t("auth:intents_form.community_organizing")),
    ).toBeVisible();
    expect(
      screen.getByText(t("auth:intents_form.something_else")),
    ).toBeVisible();
  });
});
