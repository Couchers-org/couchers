import { LngLat } from "maplibre-gl";
import { useRouter } from "next/router";
import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Coordinates } from "@/features/search/utils/constants";
import sentry from "@/platform/sentry";
import { nominatimQuery } from "@/utils/nominatim";

// Locations having one of these keys are considered non-regions.
// https://nominatim.org/release-docs/latest/api/Output/#addressdetails

const useIsMounted = () => {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
};

const useSafeState = <State>(
  isMounted: MutableRefObject<boolean>,
  initialState: State | (() => State),
): [State, Dispatch<SetStateAction<State>>] => {
  const [state, setState] = useState(initialState);

  const safeSetState = useCallback(
    (newState: SetStateAction<State>) => {
      if (isMounted.current) {
        setState(newState);
      }
    },
    [isMounted],
  );

  return [state, safeSetState];
};

export interface GeocodeResult {
  name: string;
  simplifiedName: string;
  location: LngLat;
  bbox: Coordinates;
  isRegion?: boolean;
}

const useGeocodeQuery = () => {
  const isMounted = useIsMounted();
  const [isLoading, setIsLoading] = useSafeState(isMounted, false);
  const [error, setError] = useSafeState<string | undefined>(
    isMounted,
    undefined,
  );
  const [results, setResults] = useSafeState<GeocodeResult[] | undefined>(
    isMounted,
    undefined,
  );

  const query = useCallback(
    async (value: string) => {
      if (!value) {
        return;
      }
      setIsLoading(true);
      setError(undefined);
      setResults(undefined);

      try {
        setResults(await nominatimQuery(value));
      } catch (e) {
        sentry.captureException(e, {
          tags: {
            hook: "useGeocodeQuery",
          },
        });
        setError(e instanceof Error ? e.message : "");
      }

      setIsLoading(false);
    },
    [setError, setIsLoading, setResults],
  );

  return { isLoading, error, results, query };
};

const usePrevious = <T>(value: T) => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

const useUnsavedChangesWarning = ({
  isDirty,
  isSubmitted,
  warningMessage,
}: {
  isDirty: boolean;
  isSubmitted: boolean;
  warningMessage: string;
}) => {
  const router = useRouter();
  // https://github.com/vercel/next.js/issues/2694#issuecomment-732990201
  useEffect(() => {
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      e.returnValue = warningMessage;
      return;
    };
    const handleBrowseAway = () => {
      if (!isDirty || isSubmitted) return;
      if (window.confirm(warningMessage)) return;
      router.events.emit("routeChangeError");
      throw Error("Cancelled due to unsaved changes");
    };
    window.addEventListener("beforeunload", handleWindowClose);
    router.events.on("routeChangeStart", handleBrowseAway);
    return () => {
      window.removeEventListener("beforeunload", handleWindowClose);
      router.events.off("routeChangeStart", handleBrowseAway);
    };
  }, [isDirty, router.events, isSubmitted, warningMessage]);
};

export {
  useGeocodeQuery,
  useIsMounted,
  usePrevious,
  useSafeState,
  useUnsavedChangesWarning,
};
