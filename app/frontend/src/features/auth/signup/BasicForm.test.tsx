import { render, screen, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import { StatusCode } from "grpc-web";
import React from "react";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

import { useAuthContext } from "../AuthProvider";
import { CONTINUE, EMAIL_LABEL, NAME_LABEL } from "../constants";
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
    userEvent.click(await screen.findByRole("button", { name: CONTINUE }));

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
    userEvent.type(await screen.findByLabelText(NAME_LABEL), "Frodo");
    userEvent.click(await screen.findByRole("button", { name: CONTINUE }));

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
    userEvent.type(
      await screen.findByLabelText(EMAIL_LABEL),
      "frodo@couchers.org.invalid"
    );
    userEvent.click(await screen.findByRole("button", { name: CONTINUE }));

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
    userEvent.type(await screen.findByLabelText(NAME_LABEL), "Frodo");
    userEvent.type(
      await screen.findByLabelText(EMAIL_LABEL),
      "frodo@couchers.org.invalid"
    );

    userEvent.click(await screen.findByRole("button", { name: CONTINUE }));

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

    userEvent.type(screen.getByLabelText(NAME_LABEL), "Test user");
    userEvent.type(
      screen.getByLabelText(EMAIL_LABEL),
      "test@example.com{enter}"
    );
    mockConsoleError();
    await assertErrorAlert("Permission denied");
  });
});
