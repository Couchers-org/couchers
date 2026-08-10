import { useCallback, useState } from "react";
import { clearState as nativeLinkClearState, sendState } from "utils/nativeLink";

type StorageType = "localStorage" | "sessionStorage";

export function useClearablePersistedState<T>(
  key: string,
  defaultValue: T,
  storage: StorageType = "localStorage",
): [T | undefined, (value: T) => void, () => void] {
  // in ssr, window doesn't exist, just use default
  const saved = typeof window !== "undefined" ? window[storage].getItem(key) : null;
  const [_state, _setState] = useState<T | undefined>(() => {
    let initialValue: T | undefined;
    try {
      initialValue = saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      initialValue = defaultValue;
    }
    return initialValue;
  });
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

/**
 * @todo Consolidate all usage to this hook eventually - the clearable version should be doable via this hook only so the
 * state has stronger typing and doesn't need to be type casted.
 */
export function usePersistedState<T>(key: string, defaultValue: T, storage: StorageType = "localStorage") {
  const [state, setState] = useClearablePersistedState(key, defaultValue, storage);
  return [state as T, setState] as const;
}

export function clearStorage() {
  window.sessionStorage.clear();
}
