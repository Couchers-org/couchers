import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

function useIsMounted() {
  const isMounted = useRef(false);

  useLayoutEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

function useSafeState<State>(
  isMounted: MutableRefObject<boolean>,
  initialState: State | (() => State)
): [State, Dispatch<SetStateAction<State>>] {
  const [state, setState] = useState(initialState);

  const safeSetState = useCallback(
    (newState: SetStateAction<State>) => {
      if (isMounted.current) {
        setState(newState);
      }
    },
    [isMounted]
  );

  return [state, safeSetState];
}

export { useIsMounted, useSafeState };
