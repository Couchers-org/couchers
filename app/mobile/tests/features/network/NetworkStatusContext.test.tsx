import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as Network from "expo-network";
import { ReactNode } from "react";

import {
  NetworkStatusProvider,
  useNetworkStatus,
} from "@/features/network/NetworkStatusContext";

jest.mock("expo-network", () => ({
  getNetworkStateAsync: jest.fn(),
  addNetworkStateListener: jest.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <NetworkStatusProvider>{children}</NetworkStatusProvider>;
}

// Lets the initial connection check settle so it can't overwrite later events
async function renderNetworkStatus() {
  const rendered = renderHook(() => useNetworkStatus(), { wrapper });
  await act(async () => {});
  return rendered;
}

describe("NetworkStatusContext", () => {
  let emitNetworkState: (state: Network.NetworkState) => void;

  beforeEach(() => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    (Network.addNetworkStateListener as jest.Mock).mockImplementation(
      (listener) => {
        emitNetworkState = listener;
        return { remove: jest.fn() };
      },
    );
  });

  it("is online when connected", async () => {
    const { result } = await renderNetworkStatus();

    expect(Network.getNetworkStateAsync).toHaveBeenCalled();
    expect(result.current.isOffline).toBe(false);
  });

  it("is offline when the device has no connection at startup", async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });

    const { result } = renderHook(() => useNetworkStatus(), { wrapper });

    await waitFor(() => {
      expect(result.current.isOffline).toBe(true);
    });
  });

  it("is offline when connected to a network without internet access", async () => {
    const { result } = await renderNetworkStatus();

    act(() => {
      emitNetworkState({ isConnected: true, isInternetReachable: false });
    });

    expect(result.current.isOffline).toBe(true);
  });

  it("follows connection changes", async () => {
    const { result } = await renderNetworkStatus();

    act(() => {
      emitNetworkState({ isConnected: false });
    });
    expect(result.current.isOffline).toBe(true);

    act(() => {
      emitNetworkState({ isConnected: true, isInternetReachable: true });
    });
    expect(result.current.isOffline).toBe(false);
  });

  it("can check the connection again on demand", async () => {
    const { result } = await renderNetworkStatus();
    act(() => {
      emitNetworkState({ isConnected: false });
    });

    await act(async () => {
      await result.current.recheck();
    });

    expect(result.current.isOffline).toBe(false);
  });

  it("assumes online without a provider", () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOffline).toBe(false);
  });
});
