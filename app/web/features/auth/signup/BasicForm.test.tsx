import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusCode } from "grpc-web";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

import { useAuthContext } from "../AuthProvider";
import BasicForm from "./BasicForm";

const { t } = i18n;

const startSignupMock = service.auth.startSignup as MockedService<
  typeof service.auth.startSignup
>;

const stateAfterStart = {
  flowToken: "dummy-token",
  success: false,
  needBasic: false,
  needAccount: false,
  needAcceptCommunityGuidelines: true,
  needFeedback: true,
  needVerifyEmail: true,
};

describe("basic signup form", () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("cannot be submitted empty", async () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState).toBe(null);

    render(<BasicForm />, { wrapper });

    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: t("global:continue") }),
    );

    await waitFor(() => {
      expect(startSignupMock).not.toBeCalled();
    });

    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState).toBe(null);
  });

  it("cannot be submitted without email", async () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState).toBe(null);

    render(<BasicForm />, { wrapper });

    const user = userEvent.setup();

    await user.type(
      await screen.findByLabelText(t("auth:basic_form.name.field_label")),
      "Frodo",
    );
    await user.click(
      await screen.findByRole("button", { name: t("global:continue") }),
    );

    await waitFor(() => {
      expect(startSignupMock).not.toBeCalled();
    });

    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState).toBe(null);
  });

  it("cannot be submitted without name", async () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState).toBe(null);

    render(<BasicForm />, { wrapper });

    const user = userEvent.setup();

    await user.type(
      await screen.findByLabelText(t("auth:basic_form.email.field_label")),
      "frodo@couchers.org.invalid",
    );
    await user.click(
      await screen.findByRole("button", { name: t("global:continue") }),
    );

    await waitFor(() => {
      expect(startSignupMock).not.toBeCalled();
    });

    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState).toBe(null);
  });

  it("submits when filled in", async () => {
    startSignupMock.mockResolvedValue(stateAfterStart);
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState).toBe(null);

    render(<BasicForm />, { wrapper });

    const user = userEvent.setup();

    await user.type(
      await screen.findByLabelText(t("auth:basic_form.name.field_label")),
      "Frodo",
    );
    await user.type(
      await screen.findByLabelText(t("auth:basic_form.email.field_label")),
      "frodo@couchers.org.invalid",
    );

    await user.click(
      await screen.findByRole("button", { name: t("global:continue") }),
    );

    await waitFor(() => {
      expect(startSignupMock).toBeCalledWith(
        "Frodo",
        "frodo@couchers.org.invalid",
      );
    });
  });

  it("displays an error when present", async () => {
    startSignupMock.mockRejectedValueOnce({
      code: StatusCode.PERMISSION_DENIED,
      message: "Permission denied",
    });
    render(<BasicForm />, {
      wrapper,
    });

    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(t("auth:basic_form.name.field_label")),
      "Test user",
    );
    await user.type(
      screen.getByLabelText(t("auth:basic_form.email.field_label")),
      "test@example.com{enter}",
    );
    mockConsoleError();
    await assertErrorAlert("Permission denied");
  });
});
