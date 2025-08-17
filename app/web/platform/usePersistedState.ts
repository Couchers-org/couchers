import {
  clearState as nativeLinkClearState,
  sendState,
} from "platform/nativeLink";
import { useCallback, useEffect, useState } from "react";

type StorageType = "localStorage" | "sessionStorage";

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  storage: StorageType = "localStorage",
): [T | undefined, (value: T) => void, () => void] {
  const [_state, _setState] = useState<T | undefined>(defaultValue);

  useEffect(() => {
    // We can't directly initialize the state with the stored value, because that
    // would lead to a mismatch for the initial render between server and client
    const saved =
      typeof window !== "undefined" ? window[storage].getItem(key) : null;

    if (!saved) {
      return;
    }

    _setState(JSON.parse(saved) as T);
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
  return [_state, setState, clearState];
}

export function clearStorage() {
  window.sessionStorage.clear();
}
