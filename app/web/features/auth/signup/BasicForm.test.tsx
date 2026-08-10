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

const startSignupMock = service.auth.startSignup as MockedService<typeof service.auth.startSignup>;

const stateAfterStart = {
  flowToken: "dummy-token",
  success: false,
  needBasic: false,
  needAccount: false,
  needAcceptCommunityGuidelines: true,
  needMotivations: false,
  needFeedback: false,
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

    await user.click(await screen.findByRole("button", { name: t("global:continue") }));

    await waitFor(() => {
      expect(startSignupMock).not.toHaveBeenCalled();
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

    await user.type(await screen.findByLabelText(t("auth:basic_form.name.field_label")), "Frodo");
    await user.click(await screen.findByRole("button", { name: t("global:continue") }));

    await waitFor(() => {
      expect(startSignupMock).not.toHaveBeenCalled();
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

    await user.type(await screen.findByLabelText(t("auth:basic_form.email.field_label")), "frodo@couchers.org.invalid");
    await user.click(await screen.findByRole("button", { name: t("global:continue") }));

    await waitFor(() => {
      expect(startSignupMock).not.toHaveBeenCalled();
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

    await user.type(await screen.findByLabelText(t("auth:basic_form.name.field_label")), "Frodo");
    await user.type(await screen.findByLabelText(t("auth:basic_form.email.field_label")), "frodo@couchers.org.invalid");

    await user.click(await screen.findByRole("button", { name: t("global:continue") }));

    await waitFor(() => {
      expect(startSignupMock).toHaveBeenCalledWith("Frodo", "frodo@couchers.org.invalid", undefined);
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

    await user.type(screen.getByLabelText(t("auth:basic_form.name.field_label")), "Test user");
    await user.type(screen.getByLabelText(t("auth:basic_form.email.field_label")), "test@example.com{enter}");
    mockConsoleError();
    await assertErrorAlert("Permission denied");
  });

  describe("name validation", () => {
    it("rejects names shorter than 2 characters", async () => {
      render(<BasicForm />, { wrapper });

      const user = userEvent.setup();
      const nameInput = await screen.findByLabelText(t("auth:basic_form.name.field_label"));

      await user.type(nameInput, "A");
      await user.tab(); // Trigger blur to validate

      await waitFor(() => {
        expect(screen.getByText(t("auth:basic_form.name.min_length_error"))).toBeInTheDocument();
      });

      await user.type(await screen.findByLabelText(t("auth:basic_form.email.field_label")), "test@example.com");
      await user.click(await screen.findByRole("button", { name: t("global:continue") }));

      await waitFor(() => {
        expect(startSignupMock).not.toHaveBeenCalled();
      });
    });

    it("rejects names longer than 100 characters", async () => {
      render(<BasicForm />, { wrapper });

      const user = userEvent.setup();
      const nameInput = await screen.findByLabelText(t("auth:basic_form.name.field_label"));

      const longName = "A".repeat(101);
      await user.type(nameInput, longName);
      await user.tab(); // Trigger blur to validate

      await waitFor(() => {
        expect(screen.getByText(t("auth:basic_form.name.max_length_error"))).toBeInTheDocument();
      });

      await user.type(await screen.findByLabelText(t("auth:basic_form.email.field_label")), "test@example.com");
      await user.click(await screen.findByRole("button", { name: t("global:continue") }));

      await waitFor(() => {
        expect(startSignupMock).not.toHaveBeenCalled();
      });
    });

    it("rejects names with invalid characters like !@#$", async () => {
      render(<BasicForm />, { wrapper });

      const user = userEvent.setup();
      const nameInput = await screen.findByLabelText(t("auth:basic_form.name.field_label"));

      await user.type(nameInput, "John!@#$");
      await user.tab(); // Trigger blur to validate

      await waitFor(() => {
        expect(screen.getByText(t("auth:basic_form.name.invalid_characters_error"))).toBeInTheDocument();
      });

      await user.type(await screen.findByLabelText(t("auth:basic_form.email.field_label")), "test@example.com");
      await user.click(await screen.findByRole("button", { name: t("global:continue") }));

      await waitFor(() => {
        expect(startSignupMock).not.toHaveBeenCalled();
      });
    });

    it("accepts names with hyphens and apostrophes", async () => {
      startSignupMock.mockResolvedValue(stateAfterStart);
      render(<BasicForm />, { wrapper });

      const user = userEvent.setup();

      await user.type(await screen.findByLabelText(t("auth:basic_form.name.field_label")), "Anne-Marie O'Connor");
      await user.type(await screen.findByLabelText(t("auth:basic_form.email.field_label")), "anne@example.com");

      await user.click(await screen.findByRole("button", { name: t("global:continue") }));

      await waitFor(() => {
        expect(startSignupMock).toHaveBeenCalledWith("Anne-Marie O'Connor", "anne@example.com", undefined);
      });
    });

    it("accepts names with Unicode characters (Cyrillic)", async () => {
      startSignupMock.mockResolvedValue(stateAfterStart);
      render(<BasicForm />, { wrapper });

      const user = userEvent.setup();

      await user.type(await screen.findByLabelText(t("auth:basic_form.name.field_label")), "Иван Иванов");
      await user.type(await screen.findByLabelText(t("auth:basic_form.email.field_label")), "ivan@example.com");

      await user.click(await screen.findByRole("button", { name: t("global:continue") }));

      await waitFor(() => {
        expect(startSignupMock).toHaveBeenCalledWith("Иван Иванов", "ivan@example.com", undefined);
      });
    });

    it("accepts names at minimum length (2 characters)", async () => {
      startSignupMock.mockResolvedValue(stateAfterStart);
      render(<BasicForm />, { wrapper });

      const user = userEvent.setup();

      await user.type(await screen.findByLabelText(t("auth:basic_form.name.field_label")), "Li");
      await user.type(await screen.findByLabelText(t("auth:basic_form.email.field_label")), "li@example.com");

      await user.click(await screen.findByRole("button", { name: t("global:continue") }));

      await waitFor(() => {
        expect(startSignupMock).toHaveBeenCalledWith("Li", "li@example.com", undefined);
      });
    });

    it("rejects names with leading or trailing whitespace", async () => {
      render(<BasicForm />, { wrapper });

      const user = userEvent.setup();
      const nameInput = await screen.findByLabelText(t("auth:basic_form.name.field_label"));

      await user.type(nameInput, " Anne ");
      await user.tab(); // Trigger blur to validate

      await waitFor(() => {
        expect(screen.getByText(t("auth:basic_form.name.invalid_characters_error"))).toBeInTheDocument();
      });

      await user.type(await screen.findByLabelText(t("auth:basic_form.email.field_label")), "test@example.com");
      await user.click(await screen.findByRole("button", { name: t("global:continue") }));

      await waitFor(() => {
        expect(startSignupMock).not.toHaveBeenCalled();
      });
    });
  });
});
