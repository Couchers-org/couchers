import { act, renderHook } from "@testing-library/react";
import { notificationSettingsQueryKey } from "features/queryKeys";
import { RpcError, StatusCode } from "grpc-web";
import { QueryClient, QueryClientProvider } from "react-query";
import { service } from "service";

import useUpdateNotificationSettings from "./useUpdateNotificationSettings";

jest.mock("service");

const queryClient = new QueryClient();

describe("useUpdateNotificationSettings", () => {
  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("Should have the correct initial state", () => {
    const { result } = renderHook(() => useUpdateNotificationSettings(), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.status).toBe("idle");
  });

  it("Should call the service and invalidate the query on success", async () => {
    const mockData = {
      topic: "password",
      action: "change",
      deliveryMethod: "email" as const,
      enabled: true,
    };

    (
      service.notifications.setNotificationSettingsPreference as jest.Mock
    ).mockResolvedValue(
      {}, // Mocked successful response
    );

    jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateNotificationSettings(), {
      wrapper,
    });

    await act(async () => {
      result.current.updateNotificationSettings({
        preferenceData: mockData,
        setMutationError: jest.fn(),
      });
    });

    expect(
      service.notifications.setNotificationSettingsPreference,
    ).toHaveBeenCalledWith(mockData);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      notificationSettingsQueryKey,
    );
  });

  it("Should handle errors correctly", async () => {
    const mockError = new RpcError(
      StatusCode.CANCELLED,
      "Test error message",
      {},
    );
    const setMutationError = jest.fn();

    (
      service.notifications.setNotificationSettingsPreference as jest.Mock
    ).mockRejectedValue(mockError);

    const { result } = renderHook(() => useUpdateNotificationSettings(), {
      wrapper,
    });

    await act(async () => {
      result.current.updateNotificationSettings({
        preferenceData: {
          topic: "password",
          action: "change",
          deliveryMethod: "email",
          enabled: true,
        },
        setMutationError,
      });
    });

    expect(setMutationError).toHaveBeenCalledWith("Test error message");
    expect(result.current.isError).toBe(true);
  });
});
