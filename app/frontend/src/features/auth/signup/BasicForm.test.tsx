import { render, screen, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

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
  needAccount: true,
  needFeedback: true,
  needVerifyEmail: true,
};

describe("signup form (basic part)", () => {
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

  it("cannot be submitted without name", async () => {
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

  it("cannot be submitted without email", async () => {
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
});
