import { useCallback, useState } from "react";

import log from "@/log";
import {
  clearState as nativeLinkClearState,
  sendState,
} from "@/platform/nativeLink";

type StorageType = "localStorage" | "sessionStorage";

export const usePersistedState = <T>(
  key: string,
  defaultValue: T,
  storage: StorageType = "localStorage",
): [T | undefined, (value: T) => void, () => void] => {
  // in ssr, window doesn't exist, just use default
  const saved =
    typeof window !== "undefined" ? window[storage].getItem(key) : null;
  const [hiddenState, setHiddenState] = useState<T | undefined>(
    saved !== null ? (JSON.parse(saved) as T) : defaultValue,
  );

  const setState = useCallback(
    (value: T) => {
      if (value === undefined) {
        log.warn(`${key} can't be stored as undefined, casting to null.`);
      }
      const v = value === undefined ? null : value;
      window[storage].setItem(key, JSON.stringify(v));
      sendState(key, v);
      setHiddenState(value);
    },
    [key, storage],
  );
  const clearState = useCallback(() => {
    window[storage].removeItem(key);
    nativeLinkClearState(key);
    setHiddenState(undefined);
  }, [key, storage]);
  return [hiddenState, setState, clearState];
};

export const clearStorage = () => {
  window.sessionStorage.clear();
};
