import { render, screen, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import { StatusCode } from "grpc-web";
import { service } from "service";
import wrapper from "test/hookWrapper";
import {
  assertErrorAlert,
  mockConsoleError,
  MockedService,
  t,
} from "test/utils";

import { useAuthContext } from "../AuthProvider";
import BasicForm from "./BasicForm";

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
  it("cannot be submitted empty", async () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState).toBe(null);

    render(<BasicForm />, { wrapper });
    await userEvent.click(
      await screen.findByRole("button", { name: t("global:continue") })
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
    await userEvent.type(
      await screen.findByLabelText(t("auth:basic_form.name.field_label")),
      "Frodo"
    );
    await userEvent.click(
      await screen.findByRole("button", { name: t("global:continue") })
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
    await userEvent.type(
      await screen.findByLabelText(t("auth:basic_form.email.field_label")),
      "frodo@couchers.org.invalid"
    );
    await userEvent.click(
      await screen.findByRole("button", { name: t("global:continue") })
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
    await userEvent.type(
      await screen.findByLabelText(t("auth:basic_form.name.field_label")),
      "Frodo"
    );
    await userEvent.type(
      await screen.findByLabelText(t("auth:basic_form.email.field_label")),
      "frodo@couchers.org.invalid"
    );

    await userEvent.click(
      await screen.findByRole("button", { name: t("global:continue") })
    );

    await waitFor(() => {
      expect(startSignupMock).toBeCalledWith(
        "Frodo",
        "frodo@couchers.org.invalid"
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

    await userEvent.type(
      screen.getByLabelText(t("auth:basic_form.name.field_label")),
      "Test user"
    );
    await userEvent.type(
      screen.getByLabelText(t("auth:basic_form.email.field_label")),
      "test@example.com{enter}"
    );
    mockConsoleError();
    await assertErrorAlert("Permission denied");
  });
});
