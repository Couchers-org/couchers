import * as Network from "expo-network";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type NetworkStatusContextValue = {
  isOffline: boolean;
  recheck: () => Promise<void>;
};

const NetworkStatusContext = createContext<NetworkStatusContextValue>({
  isOffline: false,
  recheck: async () => {},
});

function isOfflineState(state: Network.NetworkState): boolean {
  // Unknown (undefined) is treated as online so we never flash the banner on startup.
  return state.isConnected === false || state.isInternetReachable === false;
}

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

  const recheck = useCallback(async () => {
    setIsOffline(isOfflineState(await Network.getNetworkStateAsync()));
  }, []);

  useEffect(() => {
    void recheck();
    const subscription = Network.addNetworkStateListener((state) => {
      setIsOffline(isOfflineState(state));
    });
    return () => subscription.remove();
  }, [recheck]);

  const value = useMemo(() => ({ isOffline, recheck }), [isOffline, recheck]);

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatus() {
  return useContext(NetworkStatusContext);
}
