import { renderHook, waitFor } from "@testing-library/react";
import { RpcError, StatusCode } from "grpc-web";
import { GetNotificationSettingsRes } from "proto/notifications_pb";
import { QueryClient } from "react-query";
import { service } from "service";
import wrapper from "test/hookWrapper";

import useNotificationSettings from "./useNotificationSettings";

const queryClient = new QueryClient();

describe("useNotificationSettings", () => {
  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it("should return data when the request is successful", async () => {
    const mockData: GetNotificationSettingsRes.AsObject = {
      doNotEmailEnabled: false,
      emailDigestEnabled: false,
      groupsList: [
        {
          heading: "Account Security",
          topicsList: [
            {
              name: "Password change",
              topic: "password",
              itemsList: [
                {
                  action: "change",
                  description: "Your password is changed",
                  digest: false,
                  email: true,
                  push: true,
                  userEditable: false,
                },
              ],
            },
          ],
        },
      ],
    };
    (
      service.notifications.getNotificationSettings as jest.Mock
    ).mockResolvedValue(mockData);

    const { result } = renderHook(() => useNotificationSettings(), {
      wrapper,
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() =>
      expect(
        service.notifications.getNotificationSettings,
      ).toHaveBeenCalledTimes(1),
    );
    expect(result.current.data).toEqual(mockData);
  });

  it("should return an error when the request fails", async () => {
    const mockError = new RpcError(StatusCode.UNKNOWN, "Error message", {});
    (
      service.notifications.getNotificationSettings as jest.Mock
    ).mockRejectedValue(mockError);

    const { result } = renderHook(() => useNotificationSettings(), {
      wrapper,
    });

    await waitFor(() => result.current.isError);

    await waitFor(() =>
      expect(
        service.notifications.getNotificationSettings,
      ).toHaveBeenCalledTimes(1),
    );

    expect(result.current.error).toEqual(mockError);
  });

  it("should be in loading state initially", () => {
    const { result } = renderHook(() => useNotificationSettings(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });
});
