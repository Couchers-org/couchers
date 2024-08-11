// import Sentry from "platform/sentry";
import { useEffect, useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T | undefined, (value: T) => Promise<void>, () => Promise<void>] {
  const [_state, _setState] = useState<T | undefined>(undefined);

  useEffect(() => {
    // Load the saved value from AsyncStorage when the component mounts
    const loadState = async () => {
      try {
        const savedValue = await AsyncStorage.getItem(key);
        if (savedValue !== null) {
          _setState(JSON.parse(savedValue));
        } else {
          _setState(defaultValue);
        }
      } catch (error) {
        console.error("Failed to load the state from AsyncStorage:", error);
        _setState(defaultValue);
      }
    };

    loadState();
  }, [key, defaultValue]);

  const setState = useCallback(
    async (value: T) => {
      try {
        if (value === undefined) {
          console.warn(`${key} can't be stored as undefined, casting to null.`);
        }
        const v = value === undefined ? null : value;
        await AsyncStorage.setItem(key, JSON.stringify(v));
        _setState(value);
      } catch (error) {
        console.error("Failed to save the state to AsyncStorage:", error);
      }
    },
    [key],
  );

  const clearState = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      _setState(undefined);
    } catch (error) {
      console.error("Failed to clear the state from AsyncStorage:", error);
    }
  }, [key]);

  return [_state, setState, clearState];
}

export function clearStorage() {
  AsyncStorage.clear();
}
