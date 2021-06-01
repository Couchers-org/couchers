import { render, screen, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

import { useAuthContext } from "../AuthProvider";
import { CONTINUE, NAME_REQUIRED } from "../constants";
import BasicForm from "./BasicForm";

const startSignupMock = service.auth.startSignup as MockedService<
  typeof service.auth.startSignup
>;

describe("signup form (basic part)", () => {
  it("cannot be submitted empty", async () => {
    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
    });

    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.flowState).toBe(null);

    render(<BasicForm />);
    userEvent.click(await screen.findByRole("button", { name: CONTINUE }));

    await waitFor(() => {
      expect(screen.findByText(NAME_REQUIRED)).toBeVisible();
    });

    expect(result.current.authActions.authError).not.toBeCalled();
  });
});
