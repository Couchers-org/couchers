import { useCallback, useEffect, useState } from "react";
import {
  clearState as nativeLinkClearState,
  sendState,
} from "utils/nativeLink";

type StorageType = "localStorage" | "sessionStorage";

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  storage: StorageType = "localStorage",
): [T | undefined, (value: T) => void, () => void, boolean] {
  // For sessionStorage: read synchronously (no SSR concern, data is per-tab)
  // For localStorage: defer to useEffect to avoid hydration mismatch
  const getInitialValue = (): T | undefined => {
    if (typeof window === "undefined") return defaultValue;
    if (storage === "sessionStorage") {
      const saved = window.sessionStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    }
    return defaultValue;
  };

  const [_state, _setState] = useState<T | undefined>(getInitialValue);
  const [isHydrated, setIsHydrated] = useState(storage === "sessionStorage");

  useEffect(() => {
    // For localStorage: sync state from storage after hydration
    if (storage === "localStorage") {
      const saved = window.localStorage.getItem(key);
      if (saved !== null) {
        _setState(JSON.parse(saved));
      }
      setIsHydrated(true);
    }
  }, [key, storage]);

  const setState = useCallback(
    (value: T) => {
      if (value === undefined) {
        console.warn(`${key} can't be stored as undefined, casting to null.`);
      }
      const v = value === undefined ? null : value;
      window[storage].setItem(key, JSON.stringify(v));
      sendState(key, v);
      _setState(value);
    },
    [key, storage],
  );
  const clearState = useCallback(() => {
    window[storage].removeItem(key);
    nativeLinkClearState(key);
    _setState(undefined);
  }, [key, storage]);
  return [_state, setState, clearState, isHydrated];
}

export function clearStorage() {
  window.sessionStorage.clear();
}
